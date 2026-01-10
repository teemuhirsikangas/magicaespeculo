#!/usr/bin/env python3
"""
Garage Temperature Monitor with Gotify Notifications
Monitors garage temperature and sends alerts via Gotify when temperature
drops below 15°C and recovery notification when it goes above 17°C.

Run via cron every 5 minutes:
*/2 * * * * /usr/bin/python3 /path/to/garage_temp_alarm.py > /dev/null 2>&1
"""

import requests
import json
import os
import sys
from datetime import datetime
import config

# Configuration
GOTIFY_URL = config.GOTIFY_URL
GOTIFY_TOKEN = config.GOTIFY_TOKEN
TEMP_ENDPOINT = config.TEMP_ENDPOINT
STATE_FILE = "/tmp/garage_temp_alarm_state.json"

# Temperature thresholds
TEMP_LOW_THRESHOLD = 12.0
TEMP_HIGH_THRESHOLD = 13.0

def send_gotify_notification(title, message, priority=5):
    """Send notification via Gotify"""
    try:
        data = {
            "title": title,
            "message": message,
            "priority": priority
        }
        response = requests.post(
            GOTIFY_URL,
            params={"token": GOTIFY_TOKEN},
            data=data,
            timeout=10
        )
        if response.status_code == 200:
            print(f"Notification sent: {title} - {message}")
            return True
        else:
            print(f"Failed to send notification. Status: {response.status_code}")
            return False
    except Exception as e:
        print(f"Error sending notification: {e}")
        return False

def get_garage_temperature():
    """Fetch current garage temperature"""
    try:
        response = requests.get(TEMP_ENDPOINT, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if data and len(data) > 0:
                # Extract garage_room temperature
                temp = float(data[0].get('garage_room', 0))
                timestamp = data[0].get('timestamp')
                return temp, timestamp
        return None, None
    except Exception as e:
        print(f"Error fetching temperature: {e}")
        return None, None

def load_state():
    """Load the previous alarm state"""
    try:
        if os.path.exists(STATE_FILE):
            with open(STATE_FILE, 'r') as f:
                return json.load(f)
    except Exception as e:
        print(f"Error loading state: {e}")
    
    # Default state
    return {
        "alarm_active": False,
        "last_notification": None,
        "last_temp": None
    }

def save_state(state):
    """Save the current alarm state"""
    try:
        with open(STATE_FILE, 'w') as f:
            json.dump(state, f)
    except Exception as e:
        print(f"Error saving state: {e}")

def main():
    print(f"=== Garage Temperature Check at {datetime.now()} ===")
    
    # Get current temperature
    temp, timestamp = get_garage_temperature()
    
    if temp is None:
        print("Failed to get temperature. Exiting.")
        sys.exit(1)
    
    print(f"Current garage temperature: {temp}°C")
    
    # Load previous state
    state = load_state()
    alarm_was_active = state.get("alarm_active", False)
    
    # Check temperature thresholds
    if temp < TEMP_LOW_THRESHOLD:
        # Temperature is low
        if not alarm_was_active:
            # First time crossing threshold
            message = f"⚠️ Autotallin lämpötila on laskenut: {temp}°C (raja: {TEMP_LOW_THRESHOLD}°C)"
            send_gotify_notification("Autotalli - Matala lämpötila", message, priority=7)
            state["alarm_active"] = True
        else:
            # Alarm already active, send reminder
            message = f"⚠️ Autotallin lämpötila edelleen alhainen: {temp}°C"
            send_gotify_notification("Autotalli - Lämpötilamuistutus", message, priority=5)
        
        state["last_notification"] = datetime.now().isoformat()
        
    elif temp > TEMP_HIGH_THRESHOLD:
        # Temperature has recovered
        if alarm_was_active:
            # Send recovery notification
            message = f"✅ Autotallin lämpötila palautunut normaaliksi: {temp}°C"
            send_gotify_notification("Autotalli - Lämpötila OK", message, priority=5)
            state["alarm_active"] = False
            state["last_notification"] = datetime.now().isoformat()
        else:
            # Temperature is normal, no alarm active
            print("Temperature is normal. No action needed.")
    
    else:
        # Temperature is between thresholds (15-17°C)
        if alarm_was_active:
            # Still in warning zone
            message = f"⚠️ Autotallin lämpötila: {temp}°C (edelleen alle {TEMP_HIGH_THRESHOLD}°C)"
            send_gotify_notification("Autotalli - Lämpötilamuistutus", message, priority=5)
            state["last_notification"] = datetime.now().isoformat()
        else:
            print("Temperature in normal range. No action needed.")
    
    # Update state
    state["last_temp"] = temp
    state["last_check"] = datetime.now().isoformat()
    save_state(state)
    
    print(f"Alarm active: {state['alarm_active']}")
    print("=== Check complete ===\n")

if __name__ == "__main__":
    main()
