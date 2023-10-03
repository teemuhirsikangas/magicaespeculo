#!/usr/bin/python

#run this script in cronjob every hour 1 minute after

# https://api.spot-hinta.fi/swagger/ui#/(JSON)%20Prices%20today/Today

# curl -X GET "https://api.spot-hinta.fi/TodayAndDayForward?HomeAssistant=false" -H  "accept: application/json"
# https://api.spot-hinta.fi/TodayAndDayForward?HomeAssistant=false


import time
import os
import json
import requests
from requests.auth import HTTPDigestAuth
import pprint
import time
import paho.mqtt.publish as publish
import config #passwords for mqtt, url etc from config.py

CHEAPESTHOURS = 12 # only enable xx cheapest hours
ALLOWPRICE = 5 # or allow if price is lower than this (eur cents)
url = 'https://api.spot-hinta.fi/JustNow'
MQTT_USER = config.username
MQTT_PWD = config.password
MQTT_BROKER_ADDR = config.MQTT_ADDRESS
AUTH = {'username':config.username, 'password':config.password}

headers = {
   'accept': 'application/json'
}
def publishData(state):
        #time = str(datetime.datetime.now().replace(microsecond=0).isoformat(' '))
		epoch_time = int(time.time())
		payload = { 'time' : epoch_time, 'state' : state }

		payload_string = json.dumps(payload)
		print("MQTT payload sent:", payload_string)
		publish.single("home/engineroom/heatpumpevu", payload_string, retain=True, hostname=MQTT_BROKER_ADDR, auth=AUTH)

resp = requests.get(url, headers=headers)
if resp.status_code == requests.codes.ok:
	json_data = resp.json()
	print (json_data)
	print("to allow heating, conditions must match;")
	print("RANK must be", json_data["Rank"],"<=", CHEAPESTHOURS)
	print("PRICE must be",json_data["PriceWithTax"],"<=", ALLOWPRICE)

	if (json_data["Rank"] <= CHEAPESTHOURS):
		print ("Enable heating")
		publishData(1)
	elif(json_data["PriceWithTax"] <= ALLOWPRICE):
		print ("Enable heating as price limit not reached")
		publishData(1)
	else:
		print ("disable heating, expensive")
		publishData(0)

else:
	#TODO: retry after 1 min for 3x, and enable if cannot connect
	#and then set HP as enabled if no connection
	print(resp.status_code)
	print ("Enable heating, (could not get prices)")
	publishData(1)
