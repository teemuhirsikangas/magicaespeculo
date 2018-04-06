#!/usr/bin/python

import sys
import RPi.GPIO as GPIO
import time
import subprocess

GPIO.setmode(GPIO.BCM)
PIR_PIN = 8
GPIO.setup(PIR_PIN, GPIO.IN)
MONITOROFF_DELAY = 120 #seconds
turned_off = False
last_motion_time = time.time()

def MOTION(PIR_PIN):
	#print("Motion Detected. Monitor ON")
	MONITORON()

def MONITORON():
	global turned_off 
	global last_motion_time
	last_motion_time = time.time()
	#print("Monitor ON")
	if turned_off:
		subprocess.call("tvservice -p && sudo chvt 1 && sudo chvt 7", shell=True)
		turned_off = False

def MONITOROFF():
	global turned_off
        #print("Monitor off")
        subprocess.call("tvservice -o", shell=True)
	turned_off = True

def NOMOTION(PIR_PIN):
	print("NO MOTION")

#print ("PIR Module Test (CTRL+C to exit)")
time.sleep(60)
#print ("Ready")

try:
	turned_off = False
	GPIO.add_event_detect(PIR_PIN, GPIO.RISING, callback=MOTION)
	#GPIO.add_event_detect(PIR_PIN, GPIO.FALLING, callback=NOMOTION)
	while (1):
		time.sleep(60)
		#print(str(turned_off) + " " + str(time.time()) +" > " + str(last_motion_time +MONITOROFF_DELAY))
		if not turned_off and time.time() > (last_motion_time + MONITOROFF_DELAY):
			MONITOROFF()
except KeyboardInterrupt:
	print (" Quit")
	GPIO.cleanup()

