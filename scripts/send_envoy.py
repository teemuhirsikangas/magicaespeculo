#!/usr/bin/python
import time
import os
import json
import requests
from requests.auth import HTTPDigestAuth
import pprint
import time

#script for querying solar production data from Emphase Envoy-s on local network

EnvoyBaseURl = 'http://envoy.local'
envoyUrl = EnvoyBaseURl + '/api/v1/production/inverters'
envoyPWD = '006468' #last 6 digits of your envoy serial number
envoyuser = 'envoy'

#payload = {}
entry1List = []

#producing_inv = { }
producingList = []

#inverterstatus
envoyUrl1 = EnvoyBaseURl + '/inventory.json'
resp1 = requests.get(envoyUrl1,auth=HTTPDigestAuth(envoyuser,envoyPWD))
if resp1.status_code == requests.codes.ok:
	json_data1 = resp1.json()
	#print (json_data1)

  	devices_json = json_data1[0]['devices']
	
	for inverter in devices_json:

		producing = inverter['producing']
		serial_num = inverter['serial_num']
		producing_data = {'serialNumber' : serial_num, 'producing' : producing }
		producingList.append(producing_data)


else:
	print(resp.status_code)

#print(producingList)

#per panel wattage + add production status
resp = requests.get(envoyUrl,auth=HTTPDigestAuth(envoyuser,envoyPWD))
if resp.status_code == requests.codes.ok:
	json_data = resp.json()
	#print (json_data)

	#go thorough inverters
	for inverter in json_data:
		#print(inverter)

		#with this serialnumber search the production status from earlier prducingList data and merge them
		searchSerial = inverter['serialNumber']
		#print searchSerial

		producingdata = []
		for i in producingList:
			#print(i)
			if(i['serialNumber'] == searchSerial):
				#print(searchSerial, i['serialNumber'], i['producing'])
				#add producing status to inverters array
				producingdata = i['producing'] 

		lastReportDate = inverter['lastReportDate']
		lastReportWatts = inverter['lastReportWatts']
		maxReportWatts = inverter['maxReportWatts']
		
		inverterdata = { 'serialNumber' : searchSerial, 'producing' : producingdata, 'lastReportDate' : lastReportDate, 'lastReportWatts' : lastReportWatts, 'maxReportWatts' : maxReportWatts  }
		entry1List.append(inverterdata)

else:
	print(resp.status_code)

#per panel wattage
envoyUrl2 = EnvoyBaseURl + '/production.json'

resp2 = requests.get(envoyUrl2,auth=HTTPDigestAuth(envoyuser,envoyPWD))
if resp2.status_code == requests.codes.ok:
	json_data2 = resp2.json()
	#print (json_data2)
	
	wNow = json_data2['production'][0]['wNow']
	whLifetime = json_data2['production'][0]['whLifetime']
	readingTime = json_data2['production'][0]['readingTime']

else:
	print(resp.status_code)



#historydata
envoyUrl3 = EnvoyBaseURl + '/api/v1/production/'
resp3 = requests.get(envoyUrl3,auth=HTTPDigestAuth(envoyuser,envoyPWD))
if resp3.status_code == requests.codes.ok:
	json_data3 = resp3.json()
	#print (json_data3)
	
	wattHoursToday = json_data3['wattHoursToday']
	wattHoursSevenDays = json_data3['wattHoursSevenDays']

	data = {'wNow': wNow, 'whLifetime': whLifetime, 'readingTime' : readingTime, 'wattHoursToday' : wattHoursToday, 'wattHoursSevenDays' : wattHoursSevenDays, "inverters": entry1List }	

else:
	print(resp.status_code)


payload = json.dumps(data)
#pprint.pprint(payload)


url = 'http://numberpi.local:3333/envoy/'
headers = {'content-type': 'application/json'}
r = requests.post(url, data = payload, headers = headers)
