#!/usr/bin/env python

import minimalmodbus
import time
from time import sleep
import json
import requests

instrument = minimalmodbus.Instrument('/dev/ttyUSB0', 1) # port name, slave address (in decimal)
instrument.serial.timeout  = 2.00
#instrument.debug = True
#instrument.handle_local_echo = False

registeraddress = 1    #first address of the modbus register
numberOfRegisters = 45 #how many modbus registers are fetched
functioncode = 3       #3 is modbus holdring registers

def twosComplementToInt(value, bits):
    if (int(value) & (1 << (bits - 1))) == 0:
        return value
    tmp = 0
    for i in range(0, bits):
        if (int(value - 1) & (1 << i)) == 0:
            tmp = tmp | (1 << i)
    return -tmp

#1-12 TYPE_INT16_10, #13-30 TYPE_INT16, #31-34 TYPE_INT16_10, #35-43 TYPE_INT16, #44 TYPE_UINT16, #45 TYPE_INT16
def read_registers():

    for x in range(0, 5): #try 5 times
        try:
            data = instrument.read_registers(registeraddress,numberOfRegisters,functioncode)
            return data

        except (IOError, ValueError, TypeError) as e:
            sleep(0.5)
            #print("Failed to read from instrument")
            #print e

data = read_registers()
#print(data)

#1-12 TYPE_INT16_10 from Enervent register spesification
payload = {
#6, fresh
'fresh': twosComplementToInt(data[5],16)/10.0,
#7 supply_hr
'supply_hr': twosComplementToInt(data[6],16)/10.0,
#8 supply
'supply': twosComplementToInt(data[7],16)/10.0,
#9waste
'waste': twosComplementToInt(data[8],16)/10.0,
#10 exhaust
'exhaust': twosComplementToInt(data[9],16)/10.0,
#13-30 TYPE_INT16
#13 exhaust_humidity
'exhaust_humidity': twosComplementToInt(data[12],16),
#29 hr_effiency_in
'hr_effiency_in': twosComplementToInt(data[28],16),
#30 hr_efficiency_out
'hr_efficiency_out': twosComplementToInt(data[29],16),
#35 humidity_48h
'humidity_48h': twosComplementToInt(data[34],16),
#44 TYPE_UINT16
#44 control_state
'control_state': data[43],
#45 TYPE_INT16
#45 heating_status
'heating_status':twosComplementToInt(data[44],16)
}

#print (payload)
url = 'http://numberpi.local:3333/ventilation/'
headers = {'content-type': 'application/json'}
r = requests.post(url, data = json.dumps(payload), headers = headers)
