#!/usr/bin/python
# run this in cronjob:
#sleep 10 secs, as thermiq polls every minute, trying to avoid collisions
# 5,20,35,50 * * * * sleep 15; python3 /home/pi/magicaespeculo/scripts/thermia.py > /dev/null 2>&1

#Using ThermIQ to control Thermia diplomat (danfoss) ground heat pump
# when spot price is under configurable value in config.py (5c)  and heat pump integral is >-150 and out side temp <10, change room target temp to 20 )(+2 increase is curve), otherwise keep or change back to 19 (+0)
# run script every 15mins
# integral must be >= -150, otherwise the Aux. heater 3 kW might come on, avoid that
# and comfort heat mode allowed between 22-07 only
# check status every 15mins, 05,20,35,50 (5 past so spot prices etc have been updated)
#read spot value from MQTT topic
### default config
# ALLOWED_START ="22:00"
# ALLOWED_STOP ="07:00"
# TARGET_TEMP = 20
# ECO_TEMP = 19
# INTEGRAL_LIMIT = -150
# COMFORTDISABLETEMP = 10


import requests
import paho.mqtt.client as mqtt
import paho.mqtt.publish as publish
import paho.mqtt.subscribe as subscribe
import serial
import sys
import time
from datetime import datetime
import json
import config #passwords for mqtt, url etc from config.py

ALLOWED_START = config.ALLOWED_START
ALLOWED_STOP = config.ALLOWED_STOP
TARGET_TEMP = config.TARGET_TEMP
ECO_TEMP = config.ECO_TEMP
INTEGRAL_LIMIT = config.INTEGRAL_LIMIT

MQTT_USER = config.username
MQTT_PWD = config.password
MQTT_HOST = config.MQTT_ADDRESS
AUTH = {'username':config.username, 'password':config.password}

# Constants for ThermIQ serial connection
BAUDRATE = 9600
TIMEOUT = 10
TTYPORT = "/dev/ttyUSB2"

TYPE_INT16 = 1
TYPE_UINT16 = 2
TYPE_INT16_10 = 3
TYPE_UINT16_10 = 4

def open_serial_port(port):
    try:
        ser = serial.Serial(
            port=port,              # Your serial port, e.g., '/dev/ttyUSB0' on Linux or 'COM3' on Windows
            baudrate=BAUDRATE,       # ThermIQ's baud rate
            timeout=TIMEOUT,         # Timeout for reading from serial
            bytesize=serial.EIGHTBITS,
            parity=serial.PARITY_NONE,
            stopbits=serial.STOPBITS_ONE
        )
        return ser
    except serial.SerialException as e:
        print(f"Error opening serial port: {e}")
        return None

def twosComplementToInt(value, bits):
    if (int(value) & (1 << (bits - 1))) == 0:
        return value
    # complement
    temp = 0
    for i in range(0, bits):
        if (int(value-1) & (1 << i)) == 0:
            temp = temp | (1 << i)
    return -temp


def intToTwosComplement(value, bits):
    if value >= 0:
        return value
    
    temp = int(-value)
    res = 0
    hasone = 0
    for i in range(0, bits):
        if hasone and temp & (1 << i) == 0:
            res = res | (1 << i)
        elif not hasone and temp & (1 << i) != 0:
            hasone = 1
            res = res | (1 << i)
    return res

def convertThermIQMessage(type, data):
    if len(data) < 4:
        return ""

    temp = 0
    try:
        temp = int(data, 16)
    except:
        return ""

    if type == TYPE_INT16:
        temp = twosComplementToInt(temp, 16)
        temp = "%d" % temp
        return temp
    elif type == TYPE_UINT16:
        temp = "%d" % temp
        return temp
    elif type == TYPE_INT16_10:
        temp = twosComplementToInt(temp, 16)
        temp = "%.1f" % (temp / 10.0)
        return temp
    elif type == TYPE_UINT16_10:
        temp = "%.1f" % (temp / 10.0)
        return temp

    return ""


# returns (int, value)
# 0 = ok, but not ready
# 1 = ok
# 2 = error
def checkThermIQMessage(data, id):
    if len(data) <= 0:
        return (0, '')

    #rows = string.split(data, '\n')
    rows = data.split('\n')
    for row in rows:
        row = row.strip()
        if len(row) == 7 and row[2] == '=':
            vid = -1
            try:
                vid = int(row[:2], 16)
            except:
                vid = -1
            if vid == id:
                return (1, row[3:])

    return (2, '')

def send_thermiq_command(ser, command):
    try:
        ser.write(command.encode())  # Send command
        ser.flush()                  # Ensure data is sent immediately
        print(f"Sent command: {command}")
    except serial.SerialTimeoutException:
        print("Timeout while writing to the serial port")

def read_thermiq_response(ser, waitfor):
    try:
        res = b""  # Initialize as bytes
        temp = b" "  # temp should also be bytes
        while len(temp) > 0:
            #print("read one byte")
            temp = ser.read(1)  # Read one byte at a time
            #print(temp)
            if len(temp) <= 0:
                ser.flushInput()
                return (0, "")
            #print(res)
            #print(temp)
            res += temp  # Concatenate bytes
            #print(waitfor.encode())
            #print(res)
            str_res = res.decode('utf-8') 
            str_res = str_res.replace('\r\n','\n').replace('\r','\n')
            if str_res.endswith(waitfor):  # Check if response ends with 'OK\n'
                ser.flushInput()
                return (1, str_res)  # Decode to string
        ser.flushInput()
        return (0, "")
    except serial.SerialTimeoutException:
        print("Timeout while reading from the serial port")
        return None

def fetchById(ser, type, id):
    send_thermiq_command(ser, 'atr%02x\n' % id)  # Send command
    (stat, res) = read_thermiq_response(ser, 'OK\n')  # Read response
    (stat, data) = checkThermIQMessage(res, id)
    value = convertThermIQMessage(type, data)
    return stat, value

def writeById(ser, value, id):
    #ser.write(b"atw320014\n")
    formatted_string = f'atw{id:02x}{value:04x}\n'
    print(repr(formatted_string))
    # byte_string = formatted_string.encode()
    # print(repr(byte_string))
    send_thermiq_command(ser, formatted_string)
    (stat, res) = read_thermiq_response(ser, 'OK\n')

    if (stat == 1):
        #All OK
        print("successfully wrote", res)
    return stat,res

def allowedToRunClock():
    current_time = datetime.now().time()

    # Define the boundaries for the night time range
    start_night_time = datetime.strptime(ALLOWED_START, "%H:%M").time()  # 22:00 (10:00 PM)
    end_night_time = datetime.strptime(ALLOWED_STOP, "%H:%M").time()    # 07:00 (7:00 AM)

    # Check if the time falls between 22:00 and 07:00 (overnight)
    if current_time >= start_night_time or current_time <= end_night_time:
        print(f"Time check ALLOW: The time {current_time} is between 22:00 and 07:00.")
        return True
    else:
        print(f"Time check DENY: The time {current_time} is not between 22:00 and 07:00.")

        return False
    
def priceUnderThreshold():
    #Get spot price
    msg = subscribe.simple("home/engineroom/spotprice", hostname=MQTT_HOST, auth=AUTH)
    print("%s %s" % (msg.topic, msg.payload))

    #b'{"Rank": 20, "DateTime": "2024-10-02T11:00:00+03:00", "PriceNoTax": 0.40008, "PriceWithTax": 0.5021, "PriceLimit": 0.05, "RankLimit": 8, "PriceWithTaxNextHour": 0.43661}'
    spotPrice = json.loads(msg.payload)
    priceNow = float(spotPrice["PriceWithTax"])
    priceLimit = float(spotPrice.get("ComfortPriceLimit", 0.05)) # if field not present, fallback to 0.05eur cents

    if priceNow <= priceLimit:
        print("price check: ALLOW " + str(priceNow) + " <=" + str(priceLimit))
        return True
    
    print("price check: DENY "+ str(priceNow) + " >" + str(priceLimit))
    return False

def integralUnderThreshold(integral):
    cintegral = float(integral)
    integralLimit = int(INTEGRAL_LIMIT)
    if cintegral >= integralLimit:
        print("INTEGRAL: ALLOW "+ str(cintegral) + " >=" + str(integralLimit))

        return True
    else:
        print("INTEGRAL DENY " + str(cintegral) + " <" + str(integralLimit))
        return False
    
def isTempChangeNeeded(currentTemp, desiredTemp):
    cTemp = int(currentTemp)
    DTemp = int(desiredTemp)
    if cTemp == DTemp:
        print("TEMP Change DENY " + str(cTemp) + "==" + str(DTemp))
        return False
    else:
        print("TEMP change ALLOW as: " + str(cTemp) + "!=" + str(DTemp))
        return True

def returnMode(currentTemp):
    cTemp = int(currentTemp)
    if cTemp <= 19:
        return "ECO"
    else:
        return "COMFORT"

def outdoorTempUnderThreshold(currentTemp):
   limitTemp = int(config.COMFORTDISABLETEMP)
   cTemp = float(currentTemp)
   if cTemp <= limitTemp:
        print("COMFORT temp ALLOW as current temperature " + str(cTemp) + " <= limit " + str(limitTemp))
        return True
   else:
        print("COMFORT temp not allowed, DENY:" + str(cTemp) + ">" + str(limitTemp))
        return False    

def sendMQTTUpdate(targetTemp, mode, integral, outdoorCurrentTemp):

        json_data = {}
        json_data["hptargetTemp"] = int(targetTemp)
        json_data["hpmode"] = mode
        epoch_time = int(time.time())
        json_data["hptime"] = epoch_time
        json_data["hpintegral"] = float(integral)
        json_data["hpoutdoorTemp"] = float(outdoorCurrentTemp)
        print(json_data)

        payload_string = json.dumps(json_data)
        print("MQTT payload sent:", payload_string)
        publish.single("home/engineroom/heatpumpmode", payload_string, retain=True, hostname=MQTT_HOST, auth=AUTH)


def main():
    port = TTYPORT
    ser = open_serial_port(port)

    if ser:
        #ThermIQ register addresses in decimal:
        roomtargetTempid = 50 #room target temp
        integralid = 25 # integral value
        outdoorTempId = 0

        max_retries=3
        wait_time=7
        integral = 0
        indoorCurrentTargetTemp = 0
        outdoorCurrentTemp = 0
        stat = 0
        stat2 = 0
        stat3 = 0
        for attempt in range(max_retries + 1):  # +1 to include the first attempt
                #fetch current values from ThermIQ serial
                (stat,integral) = fetchById(ser, TYPE_INT16, integralid)
                (stat2, indoorCurrentTargetTemp) = fetchById(ser, TYPE_INT16, roomtargetTempid)
                (stat3, outdoorCurrentTemp) = fetchById(ser, TYPE_INT16, outdoorTempId)
                print(f"Attempt {attempt + 1}: heatpump status 1 is OK: integral: {stat} indoortemp:{stat2} outdoortemp:{stat3}")
                
                if stat == 1 and stat2 == 1 and stat3 == 1: # success, other, not so much
                    print("fetch succeeded!")
                    break  # Exit the loop if successful
                else:
                    if attempt < max_retries:  # Only wait if there are more retries left
                        print(f"Retrying in {wait_time} seconds...")
                        time.sleep(wait_time)  # Wait before retrying
                    else:
                        print("All attempts failed. cannot continue, exiting app")
                        sys.exit(1) 

        #logic when COMFORT and ECO mode is allowed, refactor later to be better

        if allowedToRunClock() == True and priceUnderThreshold() == True and outdoorTempUnderThreshold(outdoorCurrentTemp) == True:
            if integralUnderThreshold(integral) == True and isTempChangeNeeded(indoorCurrentTargetTemp, TARGET_TEMP) == True:
               print("CHANGE TARGET temp to: " + str(TARGET_TEMP))
               # CHANGE TARGET TEMP, to reserve energy to floor
               #Todo, try 3 times before giving up
               (status, res) = writeById(ser, int(TARGET_TEMP), roomtargetTempid)
               if status == 1:
                  sendMQTTUpdate(TARGET_TEMP, "COMFORT", integral, outdoorCurrentTemp)
               else:
                  print("Failed to write new value to ThermIQ," + str(status))

            else:
                print("DO NOTHING.")
                #do nothing, send MQTT just to update time stamp and current status
                sendMQTTUpdate(indoorCurrentTargetTemp, returnMode(indoorCurrentTargetTemp), integral, outdoorCurrentTemp)
        else:
            print("ECO MODE, TEMP: " + str(ECO_TEMP))
            if isTempChangeNeeded(indoorCurrentTargetTemp, ECO_TEMP) == True:
                print("CHANGE TARGET TEMP back to ECO "+ str(ECO_TEMP))
                (status, res) = writeById(ser, int(ECO_TEMP), roomtargetTempid)
                if status == 1:
                    sendMQTTUpdate(ECO_TEMP, "ECO", integral, outdoorCurrentTemp)
                else:
                    print("Failed to write new value to ThermIQ," + str(status))
            else:
                print("DO NOTHING")
                #do nothing, send MQTT just to update time stamp and current status
                sendMQTTUpdate(indoorCurrentTargetTemp, returnMode(indoorCurrentTargetTemp), integral, outdoorCurrentTemp)

        ser.close()  # Close serial port when done
    else:
        print("Failed to open serial port")

if __name__ == "__main__":
    main()
