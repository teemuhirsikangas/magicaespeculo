#!/usr/bin/python

# run this script in cronjob every hour 1 minute past:
# 1 * * * * python3 /home/atnu/magicaespeculo/scripts/spot_prices.py > /dev/null 2>&1

# https://api.spot-hinta.fi/swagger/ui#/(JSON)%20Prices%20today/Today

# curl -X GET "https://api.spot-hinta.fi/TodayAndDayForward?HomeAssistant=false" -H  "accept: application/json"
# https://api.spot-hinta.fi/TodayAndDayForward?HomeAssistant=false


import time
import os
import json
from datetime import datetime
import requests
from requests.auth import HTTPDigestAuth
import pprint
import time
import paho.mqtt.publish as publish
import config #passwords for mqtt, url etc from config.py

CHEAPESTHOURS = config.CHEAPESTHOURS # only enable xx cheapest hours, Edit config.py file
ALLOWPRICE = config.ALLOWPRICE # or allow if price is lower than this (eur cents)
COMFORTPRICE = config.COMFORTPRICE # Set comfortprice limit
TRANSFERPRICEDAY = config.TRANSFERPRICEDAY
TRANSFERPRICENIGHT = config.TRANSFERPRICENIGHT
MONTHLYFEESPERHOUR = config.MONTHLYFEESPERHOUR
ALLOWED_START = config.ALLOWED_START #night time start
ALLOWED_STOP = config.ALLOWED_STOP

url = 'https://api.spot-hinta.fi/JustNow?priceResolution=60'
urlNextHour = 'https://api.spot-hinta.fi/JustNow?lookForwardHours=1&?priceResolution=60'
MQTT_USER = config.username
MQTT_PWD = config.password
MQTT_BROKER_ADDR = config.MQTT_ADDRESS
AUTH = {'username':config.username, 'password':config.password}

headers = {
   'accept': 'application/json'
}

def getTransferPrice():
    current_time = datetime.now().time()

    # Define the boundaries for the night time range
    start_night_time = datetime.strptime(ALLOWED_START, "%H:%M").time()  # 22:00 (10:00 PM)
    end_night_time = datetime.strptime(ALLOWED_STOP, "%H:%M").time()    # 07:00 (7:00 AM)

    # Check if the time falls between 22:00 and 07:00 (overnight)
    if current_time >= start_night_time or current_time <= end_night_time:
        #print(f"NIGHTTIME: The time {current_time} is between 22:00 and 07:00.")
        return TRANSFERPRICENIGHT
    else:
        #print(f"DAYTIME: The time {current_time} is not between 22:00 and 07:00.")

        return TRANSFERPRICEDAY

def publishData(state):
        #time = str(datetime.datetime.now().replace(microsecond=0).isoformat(' '))
		epoch_time = int(time.time())
		payload = { 'time' : epoch_time, 'state' : state }

		payload_string = json.dumps(payload)
		print("MQTT payload sent:", payload_string)
		publish.single("home/engineroom/heatpumpevu", payload_string, retain=True, hostname=MQTT_BROKER_ADDR, auth=AUTH)

def publishSpotData(json_data):
		# get next hour data
		resp = requests.get(urlNextHour, headers=headers)
		if resp.status_code == requests.codes.ok:
			json_data_next_hour = resp.json()
			#print(json_data_next_hour)
		else:
			json_data_next_hour["PriceWithTax"] = "NA"
		epoch_time = int(time.time())
		json_data["PriceLimit"] = ALLOWPRICE
		json_data["ComfortPriceLimit"] = COMFORTPRICE
		json_data["RankLimit"] = CHEAPESTHOURS
		json_data["PriceWithTaxNextHour"] = json_data_next_hour["PriceWithTax"]
		json_data["TotalPrice"] = getTransferPrice() + json_data["PriceWithTax"]
		json_data["MonthlyFeePerHour"] = MONTHLYFEESPERHOUR
		print(json_data)

		payload_string = json.dumps(json_data)
		print("MQTT payload sent:", payload_string)
		publish.single("home/engineroom/spotprice", payload_string, retain=True, hostname=MQTT_BROKER_ADDR, auth=AUTH)

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

	publishSpotData(json_data)
else:
	#TODO: retry after 1 min for 3x, and enable if cannot connect
	#and then set HP as enabled if no connection
	print(resp.status_code)
	print ("Enable heating, (could not get prices)")
	publishData(1)
