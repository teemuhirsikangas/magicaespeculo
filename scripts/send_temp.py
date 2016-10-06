#!/usr/bin/python
import time
import os
import json
import requests
#for adafruit dht22/AM2302 sensor lib
import sys
import Adafruit_DHT

outside_temp=os.path.join("/","mnt","1wire","10.E1B894020800","temperature")
floor_temp=os.path.join("/","mnt","1wire","10.04A794020800","temperature")
room_temp=os.path.join("/","mnt","1wire","10.D9AB94020800","temperature")

def get1wiretemp(file_name):
        file_object=open(file_name,'r')
        line=file_object.read()
        file_object.close()
        return round(float(line.lstrip()),1)

out = get1wiretemp(outside_temp)
floor = get1wiretemp(floor_temp)
room = get1wiretemp(room_temp)

sensor = Adafruit_DHT.AM2302
pin = 4
humidity, temperature = Adafruit_DHT.read_retry(sensor,pin)
humidity = round(float(humidity),1)

url = 'http://localhost:3333/homeautomation/temperature'
payload = {'floor': floor, 'room': room, 'out': out, 'humid': humidity}
#print (payload)
headers = {'content-type': 'application/json'}
r = requests.post(url, data = json.dumps(payload), headers = headers)

