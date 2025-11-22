#!/usr/bin/python

# Script to read P1 han power meter sensors form Home assistant via REST, and publish those to MQTT topic

# run this script in cronjob every 10sec part. hack to go around cronjob 1 minute interval
# * * * * * python3 /home/atnu/magicaespeculo/scripts/P1han_power_to_mqtt.py > /dev/null 2>&1
# * * * * * sleep 10; python3 /home/atnu/magicaespeculo/scripts/P1han_power_to_mqtt.py > /dev/null 2>&1
# * * * * * sleep 20; python3 /home/atnu/magicaespeculo/scripts/P1han_power_to_mqtt.py > /dev/null 2>&1
# * * * * * sleep 30; python3 /home/atnu/magicaespeculo/scripts/P1han_power_to_mqtt.py > /dev/null 2>&1
# * * * * * sleep 40; python3 /home/atnu/magicaespeculo/scripts/P1han_power_to_mqtt.py > /dev/null 2>&1
# * * * * * sleep 50; python3 /home/atnu/magicaespeculo/scripts/P1han_power_to_mqtt.py > /dev/null 2>&1

import requests
import paho.mqtt.client as mqtt
import paho.mqtt.publish as publish
import time
import config #passwords for mqtt, url etc from config.py

home_assistant_url = config.HA_ADDRESS
access_token = config.HA_TOKEN

MQTT_USER = config.username
MQTT_PWD = config.password
MQTT_HOST = config.MQTT_ADDRESS
AUTH = {'username':config.username, 'password':config.password}

mqtt_port = 1883  # Default MQTT port
mqtt_topic_prefix = "home/han"  # Prefix for the MQTT topics

# Headers including authentication
headers = {
    "Authorization": f"Bearer {access_token}",
    "Content-Type": "application/json",
}

# Sensor IDs, these are coming from home assistant P1 Han
sensors = [
    "sensor.momentary_active_export",
    "sensor.momentary_active_import",
    "sensor.momentary_active_import_phase_1",
    "sensor.momentary_active_import_phase_2",
    "sensor.momentary_active_import_phase_3",
    "sensor.momentary_active_export_phase_1",
    "sensor.momentary_active_export_phase_2",
    "sensor.momentary_active_export_phase_3",
    # Cumulative energy sensors (check your HA for exact names)
    #"sensor.cumulative_active_import",  # Total imported energy
    #"sensor.cumulative_active_export",  # Total exported energy
    # Daily energy sensors (resets at midnight)
    # these are set in homeassistant configuration.yaml as sensor
    "sensor.daily_energy_import",
    "sensor.daily_energy_export",
    "sensor.solar_surplus",
    # go-e Charger phase limiter status sensors
    "sensor.phase_overload_status",
    "input_number.goe_charger_target_amps",
]
# Function to fetch sensor data
def fetch_sensor_data(sensor_id):
    url = f"{home_assistant_url}/api/states/{sensor_id}"
    #http://192.168.100.17:8123/api/states/sensor.momentary_active_export
    #print(url)
    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        sensor_data = response.json()
        state = sensor_data['state']
        return sensor_id, state
    else:
        return sensor_id, None

# MQTT publish function
def publish_to_mqtt(client, sensor_id, state):
    topic = f"{mqtt_topic_prefix}/{sensor_id}"
    payload = str(state)
    publish.single(topic, payload, retain=True, hostname=MQTT_HOST, auth=AUTH)
    #client publish has problems with async to write all topics, it randomly misses. timeout does not work
    #client.publish(topic, payload)
    #print(f"Published to {topic}: {payload}")

# Connect to MQTT broker
mqtt_client = mqtt.Client()
mqtt_client.username_pw_set(MQTT_USER, MQTT_PWD)
mqtt_client.loop_start()
mqtt_client.connect(MQTT_HOST, mqtt_port, 60)

# Fetch and publish data for all sensors
for sensor_id in sensors:
    sensor_id, state = fetch_sensor_data(sensor_id)
    if state is not None:
        # Skip rounding for non-numeric sensors (like phase_overload_status)
        try:
            state = round(float(state), 3)
        except ValueError:
            # Keep string value as-is for non-numeric sensors
            pass
        publish_to_mqtt(mqtt_client, sensor_id, state)
        #time.sleep(0.1)
    else:
        print(f"Failed to fetch data for sensor: {sensor_id}")

mqtt_client.loop_stop()

# Disconnect MQTT client after publishing
mqtt_client.disconnect()
