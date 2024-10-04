#!/usr/bin/python
#git clone https://github.com/vilppuvuorinen/pymelcloud
#cd pymelcloud
#python3 setup.py build
#python3 setup.py install
#apt install python3-aiohttp
#setup cronjob every 10minutes (max every 5min due to melcloud ratelimit/banning)
# */10 * * * *  python3 /home/pi/magicaespeculo/scripts/melCloud.py > /dev/null 2>&1
#
# todo: when outside temperature -20C, due to bug in Mitsubishi firmware, the heatpump cannot withhold +10 degree indoor temp
# set automation to increase target temperature to 20, so it can held it warm
# device.set({"power": 1})
# device.set({"operation_mode": "heat"})
# device.set({"fan_speed": 2})
# device.set({"target_temperature": 16.0})

#fetch Sauna air-heatpump values
import aiohttp
import asyncio
import pymelcloud
import paho.mqtt.publish as publish
import json
import time
import config #passwords 

MQTT_USER = config.username
MQTT_PWD = config.password
MQTT_HOST = config.MQTT_ADDRESS
AUTH = {'username':config.username, 'password':config.password}
MQTT_PORT = 1883  # Default MQTT port

MEL_USER = config.melusername
MEL_PWD = config.melpassword

async def async_json_dumps(data):
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, json.dumps, data)


async def main():

    async with aiohttp.ClientSession() as session:
        # call the login method with the session
        token = await pymelcloud.login(MEL_USER, MEL_PWD, session=session)
        #print(token)
        # lookup the device
        devices = await pymelcloud.get_devices(token, session=session)
        device = devices[pymelcloud.DEVICE_TYPE_ATA][0]

        # perform logic on the device
        await device.update()

        json_data = {}
        epoch_time = int(time.time())
        json_data["ahptime"] = epoch_time
        json_data["name"] = device.name
        json_data["serial"] = device.serial
        json_data["last_seen"] = str(device.last_seen)
        json_data["power"] = device.power
        json_data["operation_mode"] = device.operation_mode
        json_data["daily_energy_consumed"] = device.daily_energy_consumed
        json_data["total_energy_consumed"] = device.total_energy_consumed
        json_data["room_temperature"] = device.room_temperature
        json_data["target_temperature"] = device.target_temperature
        json_data["target_temperature_min"] = device.target_temperature_min
        json_data["target_temperature_max"] = device.target_temperature_max
        json_data["fan_speed"] = device.fan_speed
        json_data["vane_horizontal"] = device.vane_horizontal
        json_data["vane_vertical"] = device.vane_vertical
        json_data["temp_unit"] = device.temp_unit

        await session.close()

        #print(json_data)
        #payload_string = await async_json_dumps(json_data)
        payload_string = json.dumps(json_data)
        publish.single("home/sauna/airheatpump", payload_string, retain=True, hostname=MQTT_HOST, auth=AUTH)


loop = asyncio.get_event_loop()
loop.run_until_complete(main())