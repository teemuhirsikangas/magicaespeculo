#!/usr/bin/python3
# PIR motion sensor script to turn monitor on/off based on motion detection
# crontab -e:
# @reboot sleep 15 && /usr/bin/python3 /home/pi/magicaespeculo/scripts/pir.py
#Raspi Trixie PIR sensor on GPIO

import sys
import RPi.GPIO as GPIO
import time
import subprocess

GPIO.setmode(GPIO.BCM)
PIR_PIN = 8
GPIO.setup(PIR_PIN, GPIO.IN)
MONITOROFF_DELAY = 120  # seconds

turned_off = False
last_motion_time = time.time()

def MOTION(PIR_PIN):
    global last_motion_time
    last_motion_time = time.time()
    MONITORON()

def MONITORON():
    global turned_off
    global last_motion_time
    last_motion_time = time.time()
    if turned_off:
        # Turn on display using wlr-randr for Wayland
        subprocess.run(["wlr-randr", "--output", "HDMI-A-1", "--on"])
        turned_off = False
        print("Monitor ON")

def MONITOROFF():
    global turned_off
    # Turn off display using wlr-randr for Wayland
    subprocess.run(["wlr-randr", "--output", "HDMI-A-1", "--off"])
    turned_off = True
    print("Monitor OFF")

# Initialize
time.sleep(5)  # Allow system to fully boot Wayland

try:
    turned_off = False
    GPIO.add_event_detect(PIR_PIN, GPIO.RISING, callback=MOTION)
    
    while True:
        time.sleep(1)
        if not turned_off and time.time() > (last_motion_time + MONITOROFF_DELAY):
            MONITOROFF()

except KeyboardInterrupt:
    print(" Quit")
    GPIO.cleanup()