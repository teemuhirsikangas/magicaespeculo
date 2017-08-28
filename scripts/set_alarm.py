#!/usr/bin/python
import json
import paho.mqtt.publish as publish
import time
import config

MQTT_USER = config.username
MQTT_PWD = config.password
MQTT_BROKER_ADDR = config.MQTT_ADDRESS
AUTH = {'username':config.username, 'password':config.password}

time = int(time.time())
state = 1

payload = { 'time' : time, 'state' : state }
publish.single("home/alarm", payload=json.dumps(payload), retain=True, hostname=MQTT_BROKER_ADDR, auth=AUTH)