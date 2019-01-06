#!/usr/bin/python
#run this script on reboot, add it to the cron job
#@reboot sudo nohup python /home/pi/magicaespeculo/scripts/send_waterleak.py & > /dev/null 2>&1
#sudo pip install paho-mqtt
#sudo pip install schedule

import sys
import RPi.GPIO as GPIO
import time
import datetime
import schedule
import paho.mqtt.publish as publish
import json
import requests
import config

GPIO.setmode(GPIO.BCM)
WL_PIN = 22
GPIO.setup(WL_PIN, GPIO.IN)

MQTT_USER = config.username
MQTT_PWD = config.password
MQTT_BROKER_ADDR = config.MQTT_ADDRESS
AUTH = {'username':config.username, 'password':config.password}

def WATER(WL_PIN):
        #time = str(datetime.datetime.now().replace(microsecond=0).isoformat(' '))
        epoch_time = int(time.time())
        #sensor is 1 when no water, 0 when water is detected, so let's flip it
        state = GPIO.input(WL_PIN)
        state ^= 1
        payload = { 'time' : epoch_time*1000, 'state' : state }
        payload_string = json.dumps(payload)
        publish.single("home/engineroom/waterleak", payload_string, retain=True, hostname=MQTT_BROKER_ADDR, auth=AUTH)

def DAILY():
        #print("TEST")
        WATER(WL_PIN)

WATER(WL_PIN)
schedule.every().day.at("06:00").do(DAILY)
schedule.every().day.at("18:00").do(DAILY)
time.sleep(1)

try:
        GPIO.add_event_detect(WL_PIN, GPIO.FALLING, callback=WATER)
        while (True):
                #sleep for 12 hours and send status report that the script is stil alive
                schedule.run_pending()
                #WATER(WL_PIN)
                time.sleep(1)

except KeyboardInterrupt:
        print ("Quit")
        GPIO.cleanup()

