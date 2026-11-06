#!/usr/bin/env python3
"""
Solis Inverter Modbus TCP to MQTT Bridge
Reads data from Solis S2-WL-ST data logger and publishes to MQTT

#waits never firmware update so the Solic Cloud and Modbus TCP can work simulataneus
#complete this in year 2027


Usage:
    python3 solis_modbus_mqtt.py        # poll once, publish, exit
    python3 solis_modbus_mqtt.py test   # print register values

Run this script in cronjob once a minute (polling more often causes SolisCloud issues):
# * * * * * python3 /home/atnu/magicaespeculo/scripts/solis_modbus_mqtt.py > /dev/null 2>&1

Requirements:
    pip install pymodbus paho-mqtt
"""

import fcntl
import signal
import sys
import time
import json
import logging
from datetime import datetime

try:
    from pymodbus.client import ModbusTcpClient
except ImportError:
    from pymodbus.client.sync import ModbusTcpClient

import paho.mqtt.client as mqtt
import config  # MQTT username/password from config.py

# Configuration
SOLIS_IP = "192.168.100.113"
SOLIS_PORT = 502
SOLIS_SLAVE_ID = 1

MQTT_BROKER = "192.168.100.3"
MQTT_PORT = 1883
MQTT_USER = config.username
MQTT_PWD = config.password
MQTT_TOPIC_PREFIX = "home/solar/solis"

MQTT_CONNECT_TIMEOUT = 10  # seconds
LOCK_FILE = "/tmp/solis_modbus_mqtt.lock"  # prevents overlapping cron runs

# Logging setup
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Solis registers read via S2-WL-ST data logger (FC4 Input Registers)
# Format: (address, count, scale, unit, signed)
REGISTERS = {
    'pv_power': (33057, 2, 1, 'W', False),          # U32
    'daily_energy': (33035, 1, 0.1, 'kWh', False),  # U16
    'total_energy': (33029, 2, 1, 'kWh', False),    # U32
    'inverter_temp': (33093, 1, 0.1, '°C', True),   # S16
}


class SolisModbusMQTT:
    def __init__(self):
        self.modbus_client = None
        self.mqtt_client = None
        self.connected_modbus = False
        self.connected_mqtt = False

    def connect_modbus(self):
        """Connect to Solis inverter via Modbus TCP"""
        try:
            self.modbus_client = ModbusTcpClient(
                host=SOLIS_IP,
                port=SOLIS_PORT,
                timeout=10
            )
            if self.modbus_client.connect():
                logger.info(f"Connected to Solis inverter at {SOLIS_IP}:{SOLIS_PORT}")
                self.connected_modbus = True
                return True
            else:
                logger.error(f"Failed to connect to Solis inverter at {SOLIS_IP}:{SOLIS_PORT}")
                return False
        except Exception as e:
            logger.error(f"Modbus connection error: {e}")
            return False

    def connect_mqtt(self):
        """Connect to MQTT broker"""
        try:
            try:
                self.mqtt_client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
            except AttributeError:
                self.mqtt_client = mqtt.Client()  # paho-mqtt < 2.0
            self.mqtt_client.username_pw_set(MQTT_USER, MQTT_PWD)
            self.mqtt_client.on_connect = self.on_mqtt_connect
            self.mqtt_client.on_disconnect = self.on_mqtt_disconnect
            self.mqtt_client.connect(MQTT_BROKER, MQTT_PORT, 60)
            self.mqtt_client.loop_start()
            return True
        except Exception as e:
            logger.error(f"MQTT connection error: {e}")
            return False

    def on_mqtt_connect(self, client, userdata, flags, rc, properties=None):
        if rc == 0:
            logger.info(f"Connected to MQTT broker at {MQTT_BROKER}:{MQTT_PORT}")
            self.connected_mqtt = True
        else:
            logger.error(f"MQTT connection failed with code {rc}")

    def on_mqtt_disconnect(self, client, userdata, *args):
        logger.warning("Disconnected from MQTT broker")
        self.connected_mqtt = False

    def read_register(self, address, count=1):
        """Read input register(s) from Solis inverter"""
        try:
            result = self.modbus_client.read_input_registers(
                address=address,
                count=count,
                slave=SOLIS_SLAVE_ID
            )
            if result.isError():
                logger.debug(f"Error reading register {address}: {result}")
                return None
            return result.registers
        except Exception as e:
            logger.debug(f"Exception reading register {address}: {e}")
            return None

    def read_all_data(self):
        """Read all configured registers and return as dictionary"""
        data = {
            'timestamp': datetime.now().isoformat(),
            'online': False
        }
        
        for name, (address, count, scale, unit, signed) in REGISTERS.items():
            value = self.read_register(address, count)
            if value is not None:
                data['online'] = True
                if count == 1:
                    raw_value = value[0]
                    # Handle signed 16-bit
                    if signed and raw_value >= 0x8000:
                        raw_value = raw_value - 0x10000
                else:
                    # Combine two 16-bit registers into 32-bit value
                    raw_value = (value[0] << 16) + value[1]
                    # Handle signed 32-bit
                    if signed and raw_value >= 0x80000000:
                        raw_value = raw_value - 0x100000000
                
                data[name] = round(raw_value * scale, 2)
                data[f'{name}_unit'] = unit
            else:
                data[name] = None

        return data

    def publish_data(self, data):
        """Publish data to MQTT"""
        if not self.connected_mqtt:
            logger.warning("MQTT not connected, skipping publish")
            return False

        messages = []
        # Publish individual values
        for key, value in data.items():
            if not key.endswith('_unit') and key not in ['timestamp', 'online']:
                topic = f"{MQTT_TOPIC_PREFIX}/{key}"
                messages.append(self.mqtt_client.publish(topic, str(value) if value is not None else "0", retain=True))

        # Publish combined JSON payload
        messages.append(self.mqtt_client.publish(
            f"{MQTT_TOPIC_PREFIX}/status",
            json.dumps(data),
            retain=True
        ))

        # Make sure everything is sent before the script exits
        for msg in messages:
            msg.wait_for_publish(timeout=5)

        logger.info(f"Published: PV={data.get('pv_power', 'N/A')}W, "
                   f"Today={data.get('daily_energy', 'N/A')}kWh, "
                   f"Total={data.get('total_energy', 'N/A')}kWh, "
                   f"Temp={data.get('inverter_temp', 'N/A')}°C")
        return True

    def wait_for_mqtt(self):
        deadline = time.time() + MQTT_CONNECT_TIMEOUT
        while not self.connected_mqtt and time.time() < deadline:
            time.sleep(0.1)
        return self.connected_mqtt

    def run_once(self):
        """Read inverter once and publish to MQTT. Returns True on success."""
        if not self.connect_mqtt() or not self.wait_for_mqtt():
            logger.error("Failed to connect to MQTT")
            return False

        if not self.connect_modbus():
            return False

        data = self.read_all_data()
        if not data.get('online', False):
            logger.warning("No data received from inverter")
            return False

        return self.publish_data(data)

    def cleanup(self):
        """Clean up connections"""
        if self.modbus_client:
            self.modbus_client.close()
            logger.debug("Modbus connection closed")
        if self.mqtt_client:
            self.mqtt_client.disconnect()
            self.mqtt_client.loop_stop()


def test_connection():
    """Test Modbus connection and read some registers"""
    logger.info(f"Testing connection to {SOLIS_IP}:{SOLIS_PORT}...")
    
    client = ModbusTcpClient(host=SOLIS_IP, port=SOLIS_PORT, timeout=10)
    
    if not client.connect():
        logger.error("Failed to connect!")
        return False
    
    logger.info("Connected! Testing registers (FC4 Input Registers)...")
    
    for desc, (addr, count, scale, unit, signed) in REGISTERS.items():
        result = client.read_input_registers(address=addr, count=count, slave=SOLIS_SLAVE_ID)
        if result.isError():
            logger.info(f"  {desc} (reg {addr}): ERROR - {result}")
        elif len(result.registers) < count:
            logger.info(f"  {desc} (reg {addr}): ERROR - got {len(result.registers)} regs, expected {count}")
        else:
            if count == 1:
                raw = result.registers[0]
                if signed and raw >= 0x8000:
                    raw = raw - 0x10000
            else:
                raw = (result.registers[0] << 16) + result.registers[1]
                if signed and raw >= 0x80000000:
                    raw = raw - 0x100000000
            value = raw * scale
            logger.info(f"  {desc} (reg {addr}): {value}")
    
    client.close()
    return True


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "test":
        # Test mode - just check connection and registers
        test_connection()
        sys.exit(0)

    # Only one instance at a time: the S2-WL-ST logger accepts a single Modbus client
    lock = open(LOCK_FILE, "w")
    try:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError:
        logger.warning("Previous run still in progress, skipping")
        sys.exit(0)

    # Let cron/kill (SIGTERM) run the finally block so connections get closed
    signal.signal(signal.SIGTERM, lambda signum, frame: sys.exit(1))

    bridge = SolisModbusMQTT()
    ok = False
    try:
        ok = bridge.run_once()
    except KeyboardInterrupt:
        logger.info("Interrupted")
    finally:
        bridge.cleanup()
    sys.exit(0 if ok else 1)
