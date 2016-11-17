#!/bin/sh
#install avahi-utils before using: sudo apt-get install avahi-utils
#add this to cron job to do daily backup at 10pm: 0 22 * * * sh /home/pi/magicaespeculo/scripts/do_backup.sh > /dev/null 2>&1
#####################################################
#add hostname here:
DEVICE="backupmachine"
ADDRESS=`avahi-resolve -n "$DEVICE.local" | cut -f 2`
#echo $ADDRESS
#force no host key checking, as the ip might change, might have secyrity problems if not using local network, beware.
#rsync -avz --delete -e "ssh -o StrictHostKeyChecking=no" /sourse_folder username@$ADDRESS:/destination/folder/here
rsync -avz --delete -e "ssh -o StrictHostKeyChecking=no" /home/pi username@$ADDRESS:/SHARE/backup
