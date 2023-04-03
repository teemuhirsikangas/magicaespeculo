# https://api.spot-hinta.fi/swagger/ui#/(JSON)%20Prices%20today/Today

# curl -X GET "https://api.spot-hinta.fi/TodayAndDayForward?HomeAssistant=false" -H  "accept: application/json"
# https://api.spot-hinta.fi/TodayAndDayForward?HomeAssistant=false

#!/usr/bin/python
import time
import os
import json
import requests
from requests.auth import HTTPDigestAuth
import pprint
import time


headers = {
   'accept': 'application/json'
}



#historydata
url = 'https://api.spot-hinta.fi/TodayAndDayForward?HomeAssistant=false'
resp = requests.get(url, headers=headers)
if resp.status_code == requests.codes.ok:
	json_data = resp.json()
	print (json_data)
	
	data = json_data['data']
	# wattHoursSevenDays = json_data3['wattHoursSevenDays']

	#data = {'wNow': wNow, 'whLifetime': whLifetime, 'readingTime' : readingTime, 'wattHoursToday' : wattHoursToday, 'wattHoursSevenDays' : wattHoursSevenDays, "inverters": entry1List }	

else:
	print(resp.status_code)


payload = json.dumps(data)
pprint.pprint(payload)


url = 'http://numberpi.local:3333/spot/'
headers = {'content-type': 'application/json'}
#r = requests.post(url, data = payload, headers = headers)

