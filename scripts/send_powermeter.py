##auto start powermeter in case reboot
#sudo cp powermeter /etc/init.d/
#sudo chmod a+x /etc/init.d/powermeter
#sudo update-rc.d powermeter defaults
import sys
import RPi.GPIO as GPIO
import time
import subprocess
import json
import requests
import datetime
from apscheduler.scheduler import Scheduler
import logging

logging.basicConfig()

GPIO.setmode(GPIO.BCM)
LDR_PIN = 18
GPIO.setup(LDR_PIN, GPIO.IN, pull_up_down=GPIO.PUD_DOWN)
#GPIO.set_glitch_filter(GPIO, 50000)
pulsecount = 0

# Start the scheduler
sched = Scheduler()
sched.start()

def BLINK(LDR_PIN):
	#do the gpio interuption read from LDR
	global pulsecount
	pulsecount = pulsecount + 1
	#print pulsecount

def BLINKB(LDR_PIN):
        #do the gpio interuption read from LDR
        #print "blinkB!"
        global pulsecount
        pulsecount = pulsecount + 1

@sched.interval_schedule(minutes=1)
def SENDDATA():

	global pulsecount
	watts = pulsecount*60/1000
	payload = {'pulsecount': pulsecount, 'watts': watts}
	pulsecount = 0;
	#print (payload)
	headers = {'content-type': 'application/json'}
	url = 'http://numberpi.local:3333/electricity'
	r = requests.post(url, data = json.dumps(payload), headers = headers)
	

time.sleep(0.3)

try:
	#GPIO.add_event_detect(LDR_PIN, GPIO.RISING, callback=BLINK, bouncetime=200)
	GPIO.add_event_detect(LDR_PIN, GPIO.FALLING, callback=BLINKB, bouncetime=200)
	while (1):
		time.sleep(1)

except KeyboardInterrupt:
	print (" Quit")
	GPIO.cleanup()
