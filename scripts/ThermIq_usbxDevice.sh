#!/bin/sh
#Thermiq usb serial converter is not added as /dev/ttyUSBx when using also another usbserial converter after reboot, so
#this must be done on reboot via root's crontab
#@reboot sudo /home/pi/ThermIq_usbxDevice.sh 2>&1
modprobe -v option
echo '04d8 fdeb' > /sys/bus/usb-serial/drivers/option1/new_id