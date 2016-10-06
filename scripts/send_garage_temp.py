#!/usr/bin/python
import time
import os
import json
import requests
import sys
import Adafruit_DHT
#1wire pin = 4
garage_floor_fn='/sys/bus/w1/devices/28-041661c17dff/w1_slave'
garage_floor2_fn='/sys/bus/w1/devices/28-031661e0c2ff/w1_slave'
storage_floor_fn='/sys/bus/w1/devices/28-0000071e6d8a/w1_slave'

def get1wiretemp(file_name):
        file_object=open(file_name,'r')
        lines=file_object.readlines()
        file_object.close()
        temp_c = read_temp(lines)
        return round(float(temp_c),1)

def read_temp(lines):
        temp_output = lines[1].find('t=')
        if temp_output != -1:
                temp_string = lines[1].strip()[temp_output+2:]
                temp_c = float(temp_string) / 1000.0
                #print(temp_c)
                return temp_c

garage_floor = get1wiretemp(garage_floor_fn)
time.sleep(0.3)
garage_floor2 = get1wiretemp(garage_floor2_fn)
time.sleep(0.3)
storage_floor = get1wiretemp(storage_floor_fn)

sensor = Adafruit_DHT.AM2302
garage_pin = 17
garage_humid, garage_room = Adafruit_DHT.read_retry(sensor,garage_pin)
garage_humid = round(float(garage_humid),1)
garage_room = round(float(garage_room),1)

storage_pin = 24
storage_humid, storage_room = Adafruit_DHT.read_retry(sensor,storage_pin)
storage_humid = round(float(storage_humid),1)
storage_room = round(float(storage_room),1)

url = 'http://numberpi.local:3333/garage/temperature'
payload = {'garage_floor': garage_floor, 'garage_floor2': garage_floor2, 'storage_floor': storage_floor, 'garage_humid': garage_humid, 'garage_room': garage_room, 'storage_humid': storage_humid, 'storage_room': storage_room}
#print (payload)
headers = {'content-type': 'application/json'}
r = requests.post(url, data = json.dumps(payload), headers = headers)
