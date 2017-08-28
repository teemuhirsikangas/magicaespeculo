#!/usr/bin/env python
#run at reboot @reboot sudo python path/to/notifications.py > /dev/null 2>&1
import config #contains MQTT username/password
import datetime
import time
import paho.mqtt.client as mqtt
import json
import requests

MQTT_USER = config.username
MQTT_PWD = config.password
MQTT_BROKER_ADDR = config.MQTT_ADDRESS
MQTT_TOPIC = "home/#"
IFTTT_DOOR_URL = "https://maker.ifttt.com/trigger/ovi/with/key/" + config.IFTTTKEY

#send door pushnotification only if alarm is set
ALARM = False

def send_IFTT_msg(url, value1, value2, value3):
        payload = { "value1" : value1, "value2" : value2, "value3" : value3 }
        #print(url)
        #print(payload)
        r = requests.post(url, data = payload)

        #todo: if other than http 200, use alternative notification method
        #print(r)

############
def on_message(client, userdata, msg):
        global ifttturl
        global ALARM
        print("message received " ,str(msg.payload.decode("utf-8")))
        print("message topic=",msg.topic)
        print("message qos=",msg.qos)
        print("message retain flag=",msg.retain)

        time = str(datetime.datetime.now().replace(microsecond=0).isoformat(' ')) + ","
        list = []
        #todo: invalid json data detection
        list = json.loads(msg.payload)
        #print(list)

        if(msg.topic == "home/alarm"):

                alarm_state = list['state']
                if(str(alarm_state) == "1"):
                        ALARM = True
                        #print("alarm true!")
                else:
                        ALARM = False
                        #print("alarm false")

        if(msg.topic == "home/lobby/door"):

                door_status = list['door_closed']

                if(str(door_status) == "1"):
                        #print("ovi kiinni")
                        door_closed = "Etuovi: Kiinni, "
                else:
                        door_closed = "Etuovi: Auki, "

                if 'too_long' in list:
                        too_long = list['too_long']
                        if(str(too_long) == "1"):
                                door_closed = door_closed + ">10s,"
                                #disable notifications for this for now
                        print(" push notification disabled for now")
                        return
                vbatt = "3v3: " + str(list['vbatt'])
                #millis = list['millis']
                millis = time
                if(ALARM):
                        send_IFTT_msg(IFTTT_DOOR_URL, door_closed, millis, vbatt)

        if(msg.topic == "home/engineroom/waterleak"):
                water_status = list['state']
                #time = str(datetime.datetime.now().replace(microsecond=0).isoformat(' ')) + ","
                measuretime = list['time']
                time = str(datetime.datetime.fromtimestamp(measuretime).replace(microsecond=0).isoformat(' ')) + ","
                #print (time2)
                if(str(water_status) == "1"):
                        water_state = "Engine room Water LEAK!! "
                        send_IFTT_msg(IFTTT_DOOR_URL, water_state, time, "")

########################################


# The callback for when the client receives a CONNACK response from the server.
def on_connect(client, userdata, flags, rc):
        print("Connected with result code " + str(rc))
        # Subscribing in on_connect() means that if we lose the connection and
        # reconnect then subscriptions will be renewed.
        client.subscribe(MQTT_TOPIC)
##########################

def main():

        client = mqtt.Client("notification")
        client.on_connect = on_connect
        client.on_message = on_message
        # Comment this out if your MQTT server does not require authentication.
        client.username_pw_set(MQTT_USER, password=MQTT_PWD)
        # Use your own particulars here.
        client.connect(MQTT_BROKER_ADDR, 1883, 60)
        # Blocking call that processes network traffic, dispatches callbacks and
        # handles reconnecting.
        # Other loop*() functions are available that give a threaded interface and a
        # manual interface.
        client.loop_forever()

if __name__ == "__main__":
        main()

