#!/usr/bin/env python3
# -*- coding: UTF-8 -*-
# modified from https://github.com/mverleun/RTL433-to-mqtt/blob/master/src/rtl2mqtt.py

#This script will listen rtl-433 messages and dump them to mqtt
#run script on start:
#@reboot sudo python3 /home/atnu/magicaespeculo/scripts/mqtt433.py > /dev/null 2>&1
#example json what is send via mqtt
#{"time": "2018-06-09 17:58:05", "cmd": 14, "id": 1813, "tristate": "00F10FFF001!", "model": "Generic Remote"}

#TODO: https://raspberrypiandstuff.wordpress.com/2017/08/04/rtl_433-on-a-raspberry-pi-made-bulletproof/
import config #contains MQTT username/password
import subprocess
import sys
import time
import paho.mqtt.client as mqtt
import os
import json

# Config section
# Uncomment these lines if your MQTT server requires authentication
MQTT_USER=config.username
MQTT_PASS=config.password
MQTT_HOST=config.MQTT_ADDRESS
MQTT_PORT=1883
MQTT_TOPIC="home/rtl_433"
MQTT_QOS=0
MQTT_RETAIN=True
# End config section

# the usb dvb-t dongle is not ready when this script is started from crontab @reboot, use 60sec timeout
time.sleep(60)
# TODO: add build instructions and correct folder
rtl_433_cmd = "/home/atnu/rtl_433/build/src/rtl_433 -U -R 30 -F json" # linux

# Define MQTT event callbacks
def on_connect(client, userdata, flags, rc):
    print("Connected with result code "+str(rc))

def on_disconnect(client, userdata, rc):
    if rc != 0:
        print("Unexpected disconnection.")

def on_message(client, obj, msg):
    print(msg.topic + " " + str(msg.qos) + " " + str(msg.payload))

def on_publish(client, obj, mid):
    print("mid: " + str(mid))

def on_subscribe(client, obj, mid, granted_qos):
    print("Subscribed: " + str(mid) + " " + str(granted_qos))

def on_log(client, obj, level, string):
    print(string)

# Setup MQTT connection

mqttc = mqtt.Client()
# Assign event callbacks
#mqttc.on_message = on_message
mqttc.on_connect = on_connect
#mqttc.on_publish = on_publish
mqttc.on_subscribe = on_subscribe
mqttc.on_disconnect = on_disconnect

# Uncomment to enable debug messages
#mqttc.on_log = on_log

mqttc.username_pw_set(MQTT_USER, password=MQTT_PASS)
mqttc.connect(MQTT_HOST, MQTT_PORT, 60)

mqttc.loop_start()

# Start RTL433 listener
rtl433_proc = subprocess.Popen(rtl_433_cmd.split(),stdout=subprocess.PIPE,stderr=subprocess.STDOUT,universal_newlines=True)

prevline=" "

while True:
    for line in iter(rtl433_proc.stdout.readline, '\n'):
        if "time" in line:
            #filter out diplicate lines, remove time element, as it might change between duplicate messages
            temp = json.loads(line)
            del temp['time']
            templine=json.dumps(temp)
            if prevline != templine:
                payload = json.loads(line)
                #print(payload)
                mqttc.publish(MQTT_TOPIC+"/sensor_" + str(payload['id']), json.dumps(payload),qos=MQTT_QOS, retain=MQTT_RETAIN)
            prevline = templine
