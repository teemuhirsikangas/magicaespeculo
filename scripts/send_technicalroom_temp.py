#!/usr/bin/python
import time
import os
import json
import requests
#for adafruit dht22/AM2302 sensor lib
import sys
import Adafruit_DHT


sensor = Adafruit_DHT.AM2302
pin = 4
technical_humid, technical_room = Adafruit_DHT.read_retry(sensor,pin)
technical_room = round(float(technical_room),1)
technical_humid = round(float(technical_humid),1)

url = 'http://numberpi.local:3333/homeautomation/technicalroom'
payload = {'technical_room': technical_room, 'technical_humid': technical_humid}
#print (payload)
headers = {'content-type': 'application/json'}
r = requests.post(url, data = json.dumps(payload), headers = headers)
