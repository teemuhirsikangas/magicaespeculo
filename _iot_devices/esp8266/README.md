#Magic Mirror esp8266 stuff

ESP8266/ESP8285 sensors shown in magic mirror project https://github.com/teemuhirsikangas/magicaespeculo
Magic Mirror receives the MQTT messages and will display/control them from the UI

## watermeter
Device checks the water consumption measurements from analog values. [Sensor made partly based on these instructions.](https://www.stall.biz/project/impulsgeber-fuer-den-wasserzaehler-selbst-gebaut)

Once 1 liter of water is consumed, it will send MQTT messge to topic: `home/engineroom/watermeter`
 ```
 with JSON payload: {"water":" 1}
 ```
[lin to code](https://github.com/teemuhirsikangas/magicaespeculo/blob/master/esp8266/watermeter)

## garage ventilator 
Arduino SDK OTA update enabled, for easy update
##### Send MQTT message to control the Relay attached to ventilator/fan:
mode `AUTO`: Relay will stop automatically the ventilator when reaching `humid_high` value, and stops when reaches `humid_low` value. auto mode check humidity values every 10 minutes
mode `ON`: FAN is on always. (note, when plugging in the power cable for the fan, this is the default mode and works if no wifi signal is present)
mode `OFF` FAN is stopped
```
mosquitto_pub -u username -P password -h 192.168.100.3 -t home/garage/ventilator/cmd -m "{\"mode\":\"AUTO\",\"humid_low\":55,\"humid_high\":65}"
```
Receiving values from ventilator

`temp`: temperature measurement of DHT22 attached to the Sonoff relay.
`humid`: Humidity measurement
`mode`: Operating mode which is setup mode: `AUTO|ON|OFF`, see above
`fan`: status of the fan, `ON|OFF`
```
mosquitto_sub -u username -P password -h 192.168.100.3 -d -t home/#
example:
{"topic":"home/garage/ventilator/status","payload":{"temp":28.1,"humid":22.5,"mode":"AUTO","fan":"OFF"}}
```

- [Sonoff basic R2 relay ESP8285](https://github.com/arendst/Sonoff-Tasmota/wiki/Sonoff-Basic)
- [link to code](https://github.com/teemuhirsikangas/magicaespeculo/blob/master/esp8266/garage_ventilator)

## Garage Door Opener

-Wemos d1 mini pro + power relay to connect Turner garage door

It subscribes to MQTT topic `home/garage/activatedoor`
message content is just `1` to toggle the relay to open|stop|close door.
```
mosquitto_pub -u username -P password -h 192.168.100.3 -t home/garage/activatedoor -m "1"
```
[link to code](https://github.com/teemuhirsikangas/magicaespeculo/blob/master/esp8266/garageDoorOpener)


## Ground Heat Pump evu (disable/enable heatpump operations)

-Wemos d1 mini pro + power relay to connect Thermia Diplomat Ground Heat Pump

It subscribes to MQTT topic `home/engineroom/heatpumpevu`

JSON message content is {"time": 1696270272, "state": 0} for relay to enable Heatpump EVU
and {"time": 1696270272, "state": 1} to disable heatpump evu (normal operations allowed)
```
```
[link to code](https://github.com/teemuhirsikangas/magicaespeculo/blob/master/esp8266/heatpumpevu.ino)

Currently pyhton script run from cronjob sends the mqtt message
[link to code](https://github.com/teemuhirsikangas/magicaespeculo/blob/master/scripts/spot_prices.py)
