#!/usr/bin/python
import time
import os
import json
import requests
import sys
import sqlite3

#DB_NAME
conn = sqlite3.connect('/var/sqlite/thermiq.db')
url = 'http://numberpi.local:3333/homeautomation/datastoreday'

cursor = conn.execute('SELECT TID, COMPR_STARTS, KOMPR_H, T_UTE, T_UTE_MAX, T_UTE_MIN, T_VATTEN, TS_E, VARMVATTEN_H, T_VATTEN_MAX, T_VATTEN_MIN FROM DATASTORE_DAY ORDER BY TID DESC LIMIT 1')  
for row in cursor: 
	TID = row[0]
	COMPR_STARTS = row[1]
	KOMPR_H = row[2]
	T_UTE = row[3]
	T_UTE_MAX = row[4]
	T_UTE_MIN = row[5]
	T_VATTEN = row[6]
	TS_E = row[7]
	VARMVATTEN_H = row[8]
	T_VATTEN_MAX = row[9]
	T_VATTEN_MIN = row[10]

conn.close()

payload = {'TID':TID, 'COMPR_STARTS':COMPR_STARTS, 'KOMPR_H':KOMPR_H, 'T_UTE':T_UTE, 'T_UTE_MAX':T_UTE_MAX, 'T_UTE_MIN':T_UTE_MIN, 'T_VATTEN':T_VATTEN, 'TS_E': TS_E, 'VARMVATTEN_H':VARMVATTEN_H , 'T_VATTEN_MAX':T_VATTEN_MAX, 'T_VATTEN_MIN':T_VATTEN_MIN }
#print (payload)
headers = {'content-type': 'application/json'}
r = requests.post(url, data = json.dumps(payload), headers = headers)

