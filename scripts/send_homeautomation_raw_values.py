#!/usr/bin/python
import time
import os
import json
import requests
import sys
import sqlite3

#because the thermiq has not been commited the data to db, so query the data 15sec later
time.sleep(15)
conn = sqlite3.connect('/var/sqlite/thermiq.db')
url = 'http://numberpi.local:3333/homeautomation/datastoreraw'

cursor = conn.execute('SELECT T_BRINE_IN,T_BRINE_UT,T_FRAM,T_RETUR,CIRK_SPEED,BRINE_SPEED,HGW_VV,TRYCKR_T,TS_P,T_VATTEN,KOMPR,VARMVATTEN,TID,T_UTE, INTEGR_DIV, COMPR_STARTS FROM DATASTORE_RAW ORDER BY TID DESC LIMIT 1')  
for row in cursor: 
	T_BRINE_IN = row[0]
	T_BRINE_UT = row[1]
	T_FRAM = row[2]
	T_RETUR = row[3]
	CIRK_SPEED = row[4]
	BRINE_SPEED = row[5]
	HGW_VV = row[6]
	TRYCKR_T = row[7]
	TS_P = row[8]
	T_VATTEN = row[9]
	KOMPR = row[10]
	VARMVATTEN = row[11]
	TID = row[12]
	T_UTE = row[13]
	INTEGR_DIV = row[14]
	COMPR_STARTS = row[15]
conn.close()

payload = {'T_BRINE_IN':T_BRINE_IN,'T_BRINE_UT':T_BRINE_UT,'T_FRAM':T_FRAM,'T_RETUR':T_RETUR,'CIRK_SPEED':CIRK_SPEED,'BRINE_SPEED':BRINE_SPEED,'HGW_VV':HGW_VV,'TRYCKR_T':TRYCKR_T,'TS_P':TS_P,'T_VATTEN':T_VATTEN,'KOMPR':KOMPR,'VARMVATTEN':VARMVATTEN,'TID':TID, 'T_UTE':T_UTE, 'COMPR_STARTS':COMPR_STARTS, 'INTEGR_DIV':INTEGR_DIV }
#print (payload)
headers = {'content-type': 'application/json'}
r = requests.post(url, data = json.dumps(payload), headers = headers)

