# Magicae Speculo (Magic Mirror)
For hardware/mirror construction, see [here](http://speculo.hirsikangas.fi/dyi/magicae-speculo-magic-mirror-with-homeautomation/)

My version of **Magic Mirror** which contains
- Temperature + humidity logging (house and garage)
- Google calendar(s)
- [Beddit](http://www.beddit.com) sleep tracker statistics
- Weather forecast
- Ground heat pump monitoring ([Thermia](http://www.thermia.com/products/thermia-diplomat-optimum.asp)) 
- Home power comsumption monitoring
- TODO: Ventilation monitoring

![alt tag](http://i.imgur.com/D7GbPsj.png)
![alt tag](http://i.imgur.com/92U34gG.gif)
![alt tag](http://i.imgur.com/dcNKFjz.png)

For hardware part list, mirror frame construction, etc see the whole project [here](http://speculo.hirsikangas.fi/dyi/magicae-speculo-magic-mirror-with-homeautomation/)

* **Backend**: Raspberry Pi 2 with Rasbian Wheezy/Jessie, hosts the web backend and database with REST endpoints, and room temperature logger) [Node.JS](https://nodejs.org/en/) [Express](http://expressjs.com/) [pug](http://jade-lang.com/)  [SQLite3](https://www.sqlite.org/)
* **MIRROR**: Raspberry Pi 3 mounted back of the mirror with PIR detection to turn of monitor to conserve energy
* **Home automation**:  
    1. Ground heat pump: [ThermIQ](http://www.thermiq.net/product/thermiq-2/?lang=en) data logger connected to [Thermia Diplomat](http://www.thermia.com/products/thermia-diplomat-optimum.asp) ground heat pump   (Raspberry Pi 1 b+)
    2. Power consumption logging to monitor electricity usage (Raspberry Pi Zero)
    3. TODO: [RS-485 to USB adapter](http://www.ebay.com/itm/USB-to-RS485-TTL-Serial-Converter-Adapter-FTDI-interface-FT232RL-75176-Module-Ne-/161264238508?hash=item258c18ffac:g:c5gAAOSwT~9Wj4nl) connected to Ventilation unit [Enervent Pingvin](https://www.enervent.com/tuote/pingvin/)
    4. Garage temperature / humidity logging (Raspberry Pi Zero)

**Note:** This project is designed to be run on private network at home, so no much time spend on security aspects!
This project outgrew a bit from the original design, so db schemas etc needs refactoring :)

# INSTALL 
`git clone git@github.com:teemuhirsikangas/magicaespeculo.git`

-------------------------------------------------------------
### Backend
Raspberry pi 2/3 Jessie

node.js:
```
sh wget https://nodejs.org/dist/latest/node-v6.7.0-linux-armv7l.tar.gz
tar -xvf node-v6.7.0-linux-armv7l.tar.gz
cd node-v6.7.0-linux-armv7l/
sudo cp -R * /usr/local/
```

SQLite3:
`sudo apt-get install sqlite3`

get sources:
`git clone git@github.com:teemuhirsikangas/magicaespeculo.git`

#### Configure

##### General configure

copy sample_confs/config.js to /public/javascripts/config.js and edit

`cp sample_confs/config.js public/javascripts/config.js`

`config.js` configure google calendar id, weather location/units etc. modules which are shown can be enabled/disabled


##### Google calendar with (OAuth 2.0) and JWT tokens
`routes/calendar.js` handles all the JWT (and OAuth2) communication with [Google calendar api](https://developers.google.com/google-apps/calendar/v3/reference/) and provides Rest endpoint used from `public/javascript/calendar.js` :

**Create new project from Google console**:
https://console.developers.google.com/apis/

1. Enable Calendar API calls
2. Add OAuth 2.0 client
3. Select manage service accounts and add new service id
4. download the `.json` file and store to `data/key.json`
5. [Share]((https://support.google.com/calendar/answer/37082?hl=en)) your [google calendar](https://calendar.google.com/calendar/) to the email address provided in the key.json file.

### start
```
npm install
npm start
```

### autostart after reboot

Install pm2:
`sudo npm install -g pm2`

Autostart pm2 on reboot: 
`pm2 startup`

`chmod a+x /home/pi/magicaespeculo/scripts/mm.sh`

Start magic mirror:
`pm2 start mm.sh`

Save status to enable autostart after reboot:
`pm2 save`

You can now access the Speculo web page from http://localhost:3333 or http://[hostname].local:/3333

use guestmode to not include calendar http://localhost:3333/guestmode
use weathermiode to show only dates and weather http://localhost:3333/weathermode

Use the `config.js` to enable/disable features with `show: true` or `show: false`

Note: data loggers needs to be configured to send the data to backend, otherwise only Calendars and weather forecast works

-------------------------------------------------------------
# Frontend (MIRROR)
Raspberry Pi 3 connected to monitor in the back of the two-way mirror with [Infrared sensor](http://www.ebay.com/itm/HC-SR505-Mini-Infrared-PIR-Motion-Sensor-Precise-Infrared-Detector-Module-/201322916809?hash=item2edfc7ebc9:g:BpMAAOSwNSxVHjYw) to turn monitor on/off for energy saving

#### Configure
Change display orientation (use 1 or 3):
`sudo nano /boot/config.txt`
```    
    display_rotate=3
```
For hiding cursor: `sudo apt-get install unclutter`

Install browser:`sudo apt-get install iceweasel`
(Run Iceweasel in Fullscreen: Once installed, go to Tools > Add-ons > Extensions. Select/find MA Full screen

Scripts to run on startup:
`nano ~/.config/lxsession/LXDE-pi/autostart`
```
//@xset s off         # don't activate screensaver (works on Wheezy)
//@xset -dpms         # disable DPMS (Energy Star) features. (works on Wheezy)
//@xset s noblank     # don't blank the video device (works on Wheezy)
//@midori -e Fullscreen -a http://numberpi.local:3333   #(optional if midori is preferred kiosk mode browser)
@iceweasel http://[hostname of backend].local:3333      #e.g. http://numberpi.local:3333
@unclutter -idle 0.1 -root                              #hides mouse cursor if no movement
@/usr/bin/python /home/pi/magicaspeculo/scripts/pir.py          #starts infrared sensor to turn of monitor to save energy
```
Prevent monitor from sleeping (Jessie):
`sudo nano /etc/lightdm/lightdm.conf`

In that file, look for:
```
[SeatDefault]
```
and insert this line below
```
sh xserver-command=X -s 0 dpms
```
#### cronjobs
Autoconnect to wifi if connection goes down
`sudo crontab -e`
```
*/5 *   * * *   sudo sh /home/pi/magicaspeculo/scripts/wlan-monitor.sh > /dev/null 2>&1
```
-------------------------------------------------------------
# Ground Heat Pump

Raspberry pi 1 b+ Wheezy mounted to ground heatpump with [ThermIQ](http://www.thermiq.net/) data logger
#### Configure
[ThermIQ](http://www.thermiq.net/product/thermiq-2/?lang=en) data logger is using sqlite3 db ([how install ThermIQ on raspberry Wheezy](http://www.thermiq.net/wp-conteny/uploads/ThermIQ-installation-for-Raspberry-PI.pdf))

`git clone git@github.com:teemuhirsikangas/magicaespeculo.git`

Or copy files to
1. `/home/pi/magicaespeculo/scripts/send_homeautomation_raw_values.py` -sends status values every 60secs to backend (Json)
2. `/home/pi/magicaespeculo/scripts/send_homeautomation_yesterday_avarages.py` -sends yesterdays statistics to backend once a day (Json)

Edit scripts to match your backend address

`sudo crontab -e`
```
#send data every minute
*/1 * * * * sudo python /home/pi/magicaespeculo/scripts/send_homeautomation_raw_values.py > /dev/null 2>&1
#send data once a day at 9.00 am
0 9 * * * sudo python /home/pi/magicaespeculo/scripts/send_homeautomation_yesterday_avarages.py > /dev/null 2>&1
```

Install Python requests package 

`sudo apt-get install libkrb5-dev`

`wget https://bootstrap.pypa.io/get-pip.py`

`sudo python get-pip.py`

`sudo pip install requests==2.5.3` (later versions doesn't work with wheezy's python 2.7)

You might be required to install if above gives errors about ssl:
(`sudo pip install requests[security]`)
-------------------------------------------------------------
# Power meter
Raspberry Zero with photoresistor (LDR) reading the flashing LED from household power meter (1000 imp/kwh)

TODO: PIC HERE from wiring

Copy files to
1. `/home/pi/magicaespeculo/scripts/wlan-monitor.sh` (change wlan0 if using different interface name, check ifconfig)
2. `/home/pi/magicaespeculo/scripts/send_powermeter.py` -sends status values every 60secs to backend (Json)
3. `/home/pi/magicaespeculo/scripts/powermeter` -autostart script in case of reboot

Edit `send_powermeter.py`  to match your wiring and change the backend address

setup powermeter autostart script

```
sudo cp powermeter /etc/init.d/
sudo chmod a+x /etc/init.d/powermeter
sudo update-rc.d powermeter defaults
```

#### cronjobs
Autoconnect to wifi if connection goes down
`sudo crontab -e`
```
*/1 *   * * *   sudo sh /home/pi/magicaespeculo/scripts/wlan-monitor.sh > /dev/null 2>&1
```
-------------------------------------------------------------
### Garage temperature / humidity logging
Raspberry Zero with DS18B20 x3 and DHT22 x2

#### Hardware
TODO: PIC HERE from wiring
#### Setup 1Wire sw:
Add the following line to `/boot/config.txt`
```
dtoverlay=w1-gpio
```

add the following lines to `/etc/modules` 
```
w1-gpio
w1-therm
```
After reboot 1wire sensors should be listed in
`/sys/bus/w1/devices/`
and data in
`/sys/bus/w1/devices/00-xxxxxxxx/w1_slave`

#### Setup DHT22 libs:
```
git clone https://github.com/adafruit/Adafruit_Python_DHT
sudo apt-get update
sudo apt-get install build-essential python-dev
cd Adafruit_Python_DHT
sudo python setup.py install
```
Copy files to
1. `/home/pi/magicaespeculo/scripts/wlan-monitor.sh` (change wlan0 if using different interface name, check ifconfig)
2. `/home/pi/magicaespeculo/scripts/send_garage_temp.py` -sends status values every 60secs to backend (Json)

Edit `send_garage_temp.py`  to match your sensors and wiring and change the backend address

#### cronjobs
`sudo crontab -e`
```
*/1 * * * * sudo sh /home/pi/magicaespeculo/scripts/wlan-monitor.sh > /dev/null 2>&1
*/1 * * * * sudo python /home/pi/magicaespeculo/scripts/send_garage_temp.py > /dev/null 2>&1
```
-------------------------------------------------------------
# House temperature / humidity
Raspberry pi 2 + 1wire + DHT22 (the same Raspberry Pi that the backend)

Copy files to
1. `/home/pi/magicaespeculo/scripts/send_temp.py` -sends temperature/humidity values every 60secs to backend (Json)

`sudo crontab -e`
```
#send data every minute
*/1 * * * * sudo python /home/pi/magicaespeculo/scripts/send_temp.py > /dev/null 2>&1
```
-------------------------------------------------------------
# Ventilation
TODO:

##  external sources

Gear image `images/gear_inv_5prv.png` modified from here: (included but not used)
https://pixabay.com/en/gear-icon-innovation-industry-856921/

Lightning image `lightning-clipart-aTqeak7rc.png` from here:
http://www.clipartpanda.com/categories/lightening-clipart

`house2.png` modified from `house_org.png` http://www.clker.com/clipart-house-8.html

`flame.css`:
http://codepen.io/dazulu/pen/fGFyj


#### IDEAS/TODO:
```
BACKUP db data once a day
Robomow lawn mower schedule integration to calendar or directly via Bluetooth LE connection
BUTTON: change mirror pages to hide calendar/reload page/shutdown
Add welcome text other info which requires attention?
sd-card optimization from wear and tear
Create graphics/histogram for temperature/ground heat pump statistics (done for electricity and temperature loggin)
Add ventilation machine integration (Enervent Pingvin)
```

License
MIT

Author [Teemu Hirsikangas](http://teemu.hirsikangas.fi)

More info
The whole project documented in http://speculo.hirsikangas.fi/dyi/magicae-speculo-magic-mirror-with-homeautomation/
