# Magicae Speculo (Magic Mirror)
For hardware/mirror frame construction, see [here](https://speculo.hirsikangas.fi/dyi/magicae-speculo-magic-mirror-with-homeautomation/)

My version of **Magic Mirror** which contains
- Temperature + humidity logging (house and garage)
- Google calendar(s)
- [Beddit](http://www.beddit.com) sleep tracker statistics
- Weather forecast
- Ground heat pump monitoring ([Thermia](http://www.thermia.com/products/thermia-diplomat-optimum.asp)) 
- Home power comsumption monitoring
- Ventilation monitoring
- Solar energy/pv system: [Enphase](https://enphase.com/) [Envoy-s](https://enphase.com/en-us/products-and-services/envoy) data logging from local network, directly from Envoy-s. Feature added 07/2017
- Water consumption logging. Water meter analog dial is measured by ESP8266 sensor, which sends the data via MQTT. ESP8266 codes [here](https://github.com/teemuhirsikangas/esp8266/tree/master/watermeter). Added 03/2018
- MQTT+socket.io for receiving door, waterleak and alarm statuses realtime (TODO: update screenshot)

![alt tag](http://i.imgur.com/h9gx3G3.png)
![alt tag](http://i.imgur.com/92U34gG.gif)
![alt tag](http://i.imgur.com/dcNKFjz.png)

For hardware part list, mirror frame construction, etc see the whole project [here](https://speculo.hirsikangas.fi/dyi/magicae-speculo-magic-mirror-with-homeautomation/)

* **Backend**: Raspberry Pi 3 with Rasbian stretch, hosts the web backend and database with REST endpoints, and room temperature logger) [Node.JS](https://nodejs.org/en/) [Express](http://expressjs.com/) [pug](http://jade-lang.com/)  [SQLite3](https://www.sqlite.org/)
* **MIRROR**: Raspberry Pi 3 mounted back of the mirror with PIR detection to turn of monitor to conserve energy
* **Home automation**:  
    1. Ground heat pump: [ThermIQ](http://www.thermiq.net/product/thermiq-2/?lang=en) data logger connected to [Thermia Diplomat](http://www.thermia.com/products/thermia-diplomat-optimum.asp) ground heat pump   (Raspberry Pi 1 b+)
    2. Power consumption logging to monitor electricity usage (Raspberry Pi Zero)
    3. Ventilation: [RS-485 to USB adapter](http://www.ebay.com/itm/USB-to-RS485-TTL-Serial-Converter-Adapter-FTDI-interface-FT232RL-75176-Module-Ne-/161264238508?hash=item258c18ffac:g:c5gAAOSwT~9Wj4nl) connected to Ventilation unit [Enervent Pingvin](https://www.enervent.com/tuote/pingvin/) using modbus (rs-485) protocol
    4. Garage temperature / humidity logging (Raspberry Pi Zero)

**Note:** This project is designed to be run on private network at home, so no much time spend on security aspects!
This project outgrew a bit from the original design, so db schemas etc needs refactoring :)

# INSTALL 
`git clone https://github.com/teemuhirsikangas/magicaespeculo.git`

-------------------------------------------------------------
### Backend
Raspberry Pi 3 bullseye

node.js:
```
curl -sL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

SQLite3:
`sudo apt install sqlite3`

get sources:
`git clone https://github.com/teemuhirsikangas/magicaespeculo.git`

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
For hiding cursor: `sudo apt install unclutter`

Install browser:`sudo apt install firefox-esr` and python3
(Run Firefox in Fullscreen: Once installed, go to Tools > Add-ons > Extensions. Select/find MA Full screen

Scripts to run on startup:
`sudo nano /etc/xdg/lxsession/LXDE-pi/autostart`

```
@lxpanel --profile LXDE-pi
@pcmanfm --desktop --profile LXDE-pi
@xset s noblank
@xset s off
@xset -dpms 
@firefox http://[hostname of backend].local:3333      #e.g. http://numberpi.local:3333
@unclutter -idle 0.1 -root                              #hides mouse cursor if no movement
@/usr/bin/python3 /home/pi/magicaespeculo/scripts/pir.py         #starts infrared sensor to turn of monitor to save energy
```

#### cronjobs
Autoconnect to wifi if connection goes down
`sudo crontab -e`
```
*/5 *   * * *   sudo sh /home/pi/magicaspeculo/scripts/wlan-monitor.sh > /dev/null 2>&1
```
-------------------------------------------------------------
# Ground Heat Pump

Raspberry Pi 2 b+ mounted to ground heatpump with [ThermIQ](http://www.thermiq.net/) data logger
#### Configure
[ThermIQ](http://www.thermiq.net/product/thermiq-2/?lang=en) data logger is using sqlite3 db ([how install ThermIQ on raspberry Stretch](http://www.thermiq.net/wp-conteny/uploads/ThermIQ-installation-for-Raspberry-PI.pdf))

`git clone https://github.com/teemuhirsikangas/magicaespeculo.git`

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
#needed in case another usb serial converted:
@reboot sudo /home/pi/ThermIq_usbxDevice.sh 2>&1
```

Install Python requests package

`sudo apt install libkrb5-dev`

`wget https://bootstrap.pypa.io/get-pip.py`

`sudo python get-pip.py`

`sudo pip install requests`

-------------------------------------------------------------
# Power meter
Raspberry Zero with photoresistor (LDR) reading the flashing LED from household power meter (1000 imp/kwh)

![alt tag](http://i.imgur.com/rdK37ud.png)

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
Raspberry Zero with 3x DS18B20 and 2x DHT22 sensors

#### Hardware
![alt tag](http://i.imgur.com/WBTJp5J.png)
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

sudo apt install build-essential python-dev python-setuptools python-pip avahi-utils git
sudo pip install requests
git clone https://github.com/adafruit/Adafruit_Python_DHT
cd Adafruit_Python_DHT
sudo python setup.py install
```
Copy files to
1. `/home/pi/magicaespeculo/scripts/wlan-monitor.sh` (change wlan0 if using different interface name, check ifconfig)
2. `/home/pi/magicaespeculo/scripts/send_garage_temp.py` -sends status values every 60secs to backend (Json)

Edit `send_garage_temp.py` to match your sensors and wiring and change the backend address

#### cronjobs
`sudo crontab -e`
```
*/1 * * * * sudo sh /home/pi/magicaespeculo/scripts/wlan-monitor.sh > /dev/null 2>&1
*/1 * * * * sudo python /home/pi/magicaespeculo/scripts/send_garage_temp.py > /dev/null 2>&1
```
-------------------------------------------------------------
# House temperature / humidity
Raspberry Pi 3 + 1wire + DHT22 (the same Raspberry Pi which is the backend)

Copy files to
1. `/home/pi/magicaespeculo/scripts/send_temp.py` -sends temperature/humidity values every 60secs to backend (Json)

`sudo crontab -e`
```
#send data every minute
*/1 * * * * sudo python /home/pi/magicaespeculo/scripts/send_temp.py > /dev/null 2>&1
```
-------------------------------------------------------------
# Ventilation

`sudo apt install python-pip`

`sudo pip install minimalmodbus`


Uses minimalmodbus library to read modbus register values from Enervent Pingvin ventilation unit.
Ventilaton unit is in slave mode (when using freeway modbus port) and the script acts as master to read register values
note: minimalmodbus does not support writing to coils, use ModbusClient, see example in scripts/write_modbus_example.py

Enervent slave configuration:
```
Plug RJ4P4C wire into Enervent motherboard plug named "Freeway" (not OP1 or OP2)
Baud rate 19200, 8bit, No Parity, 1 Stopbit (8N1)
Slave adress 1
Plug  Data A (+) (red) and Data B (-) (green) wires into modbus adapter. (ground (black) and +5VDC (Yellow) not needed)
```
Enervent modbus Register list can be found from [here](http://ala-paavola.fi/jaakko/lib/exe/fetch.php?media=eda_modbus_rekisterilista_2011-02-16.pdf) (Finnish only)

Copy files to
1. `/home/pi/magicaespeculo/scripts/send_ventilation.py` -sends ventilation values every 60secs to backend (Json)

`sudo crontab -e`
```
#send data every minute
*/1 * * * * sudo python /home/pi/magicaespeculo/scripts/send_ventilation.py > /dev/null 2>&1
*/1 * * * * sudo python /home/pi/magicaespeculo/scripts/send_technicalroom_temp.py > /dev/null 2>&1
```

Install dht22 libs if technicalroom_temp.py is used

-------------------------------------------------------------
# Solar production metering with Enphase Envoy-s

Copy files to
1. `/home/pi/magicaespeculo/scripts/send_envoy.py` -sends solar production values every 60secs to backend (Json)
2. Change username/password from the file and local envoy-s url in case multiple envoy's on the same network

`sudo crontab -e`
```
#send data every minute
*/1 * * * * sudo python /home/pi/magicaespeculo/scripts/send_envoy.py > /dev/null 2>&1
```

# rtl-443 lib using 433Mhz communication

USB dongle for dvb-t to capture 433Mhz sensor data:

```
sudo apt install git cmake libusb-1.0-0.dev build-essential librtlsdr-dev doxygen

git clone https://github.com/merbanan/rtl_433.git
cd rtl-433/
mkdir build
cd build
cmake ../
make

Optional:
sudo nano /etc/modprobe.d/raspi-blacklist.conf

blacklist dvb_usb_rtl28xxu
blacklist rtl_2832
blacklist rtl_2830
```

set the rtl-433 lib location to the mqtt433.py script
`sudo crontab -e`
```
@reboot sudo python3 /home/pi/magicaespeculo/scripts/mqtt433.py > /dev/null 2>&1
```

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
Robomow lawn mower schedule integration to calendar or directly via Bluetooth LE connection
```

Changes:

17.10.2016 - Added backup script

1.2.2017 - Added Enervent Ventilation unit

15.3.2017 - Added Wiring diagrams and updated dependencies

07.07.2017 - Added Enphase Envoy-s data for solar production

22.02.2018 - Added watermeter DB and placeholder for UI

02.03.2018 - Added MQTT client sub, for watermeter data

15.3.2018 - Added socket.io for realtime MQTT message: water leak, water consumption, front and garade door status, set/get alarm status

30.5.2018 - Added Emphase envoy inverters to 3 phases and sort the microinverter arrays to same layout as in the roof

12.6.2018 - Added rtl_433 door sensors and mqtt handler, IFTT push notifications moved from python script to node

12.8.2018 Added greenhouse temp, humid and vbatt logging to db via mqtt message

3.2.2019 Changed to use Dark Sky weather api

8.2.2019 Added darkSky api to prevent corrs from clientside js, lint fixes

17.9.2021 Fix migrate to work with bootsrap 5, update deps

30.9.2022 Upgrade to awesomefont 6.x, stop animation as Rasperry pi cpu+firefox cannot handle those

18.10.2022 update deps

13.11.2022 add electricy price toggle + update deps

14.12.2022 pir.py fix to work on python3 and debian bullseye. (todo: update rest of the scripts and stuff to work on bullseye)

03.04.2023 dark sky close, move to openweather

04.10.2023 move ESP8266 scripts to this repo. ground heat pump evu control based on electric spot prices in Finland
[esp8266code](_iot_devices/esp8266/README.md)

License
MIT

Author [Teemu Hirsikangas](https://teemu.hirsikangas.fi)

The whole project documented in https://speculo.hirsikangas.fi/dyi/magicae-speculo-magic-mirror-with-homeautomation/
