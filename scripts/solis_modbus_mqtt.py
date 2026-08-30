#!/usr/bin/env python3
"""
Solis Inverter Modbus TCP to MQTT Bridge
Reads data from Solis S2-WL-ST data logger and publishes to MQTT

#waits never firmware update so the Solic Cloud and Modbus TCP can work simulataneus
#complete this in year 2027


Usage:
    python3 solis_modbus_mqtt.py

Requirements:
    pip install pymodbus paho-mqtt
"""

import time
import json
import logging
from datetime import datetime

try:
    from pymodbus.client import ModbusTcpClient
except ImportError:
    from pymodbus.client.sync import ModbusTcpClient

import paho.mqtt.client as mqtt

# Configuration
SOLIS_IP = "192.168.100.108"
SOLIS_PORT = 502
SOLIS_SLAVE_ID = 1

MQTT_BROKER = "192.168.100.3"
MQTT_PORT = 1883
MQTT_TOPIC_PREFIX = "home/solar/solis"

POLL_INTERVAL = 60  # seconds (lower causes SolisCloud issues)

# Logging setup
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Solis Modbus Register Map (Input Registers - Function Code 04)
# Adjust these based on your specific inverter model
REGISTERS = {
    # Register Address, Length, Name, Scale Factor, Unit
    'pv1_voltage': (3021, 1, 0.1, 'V'),
    'pv1_current': (3022, 1, 0.1, 'A'),
    'pv2_voltage': (3023, 1, 0.1, 'V'),
    'pv2_current': (3024, 1, 0.1, 'A'),
    'active_power': (3004, 1, 1, 'W'),          # Current power output
    'daily_energy': (3014, 1, 0.1, 'kWh'),      # Today's generation
    'total_energy': (3008, 2, 1, 'kWh'),        # Total energy (32-bit)
    'grid_voltage': (3035, 1, 0.1, 'V'),
    'grid_current': (3038, 1, 0.1, 'A'),
    'grid_frequency': (3042, 1, 0.01, 'Hz'),
    'inverter_temp': (3041, 1, 0.1, '°C'),
}

# Alternative register set for S2-WL-ST data logger (FC4 Input Registers)
# Format: (address, count, scale, unit, signed)
REGISTERS_ALT = {
    # PV inputs
    'pv1_voltage': (33049, 1, 0.1, 'V', False),
    'pv1_current': (33050, 1, 0.1, 'A', False),
    'pv2_voltage': (33052, 1, 0.1, 'V', False),
    'pv2_current': (33053, 1, 0.1, 'A', False),
    # 32-bit PV power (U32)
    'pv_power': (33057, 2, 1, 'W', False),
    # Energy counters
    'daily_energy': (33035, 1, 0.1, 'kWh', False),
    'monthly_energy': (33037, 1, 1, 'kWh', False),
    'yearly_energy': (33039, 1, 1, 'kWh', False),
    'total_energy': (33029, 2, 1, 'kWh', False),
    # Grid (S32 - positive=export, negative=import)
    'grid_power': (33130, 2, 1, 'W', True),
    # Battery
    'battery_soc': (33139, 1, 1, '%', False),
    'battery_power': (33149, 2, 1, 'W', True),  # S32 - positive=discharge
    # Loads
    'house_load': (33147, 1, 1, 'W', False),
    'backup_load': (33148, 1, 1, 'W', False),
    # Inverter status
    'inverter_temp': (33093, 1, 0.1, '°C', True),  # S16
    'grid_voltage': (33073, 1, 0.1, 'V', False),
    'grid_frequency': (33094, 1, 0.01, 'Hz', False),
}


class SolisModbusMQTT:
    def __init__(self):
        self.modbus_client = None
        self.mqtt_client = None
        self.connected_modbus = False
        self.connected_mqtt = False
        self.use_alt_registers = True  # Use alternative registers (confirmed working)

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
            self.mqtt_client = mqtt.Client()
            self.mqtt_client.on_connect = self.on_mqtt_connect
            self.mqtt_client.on_disconnect = self.on_mqtt_disconnect
            self.mqtt_client.connect(MQTT_BROKER, MQTT_PORT, 60)
            self.mqtt_client.loop_start()
            return True
        except Exception as e:
            logger.error(f"MQTT connection error: {e}")
            return False

    def on_mqtt_connect(self, client, userdata, flags, rc):
        if rc == 0:
            logger.info(f"Connected to MQTT broker at {MQTT_BROKER}:{MQTT_PORT}")
            self.connected_mqtt = True
        else:
            logger.error(f"MQTT connection failed with code {rc}")

    def on_mqtt_disconnect(self, client, userdata, rc):
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

    def read_holding_register(self, address, count=1):
        """Read holding register(s) - some Solis models use these"""
        try:
            result = self.modbus_client.read_holding_registers(
                address=address,
                count=count,
                slave=SOLIS_SLAVE_ID
            )
            if result.isError():
                return None
            return result.registers
        except Exception as e:
            return None

    def detect_register_set(self):
        """Auto-detect which register set works"""
        # Try standard registers first
        result = self.read_register(3004, 1)
        if result is not None:
            logger.info("Using standard Solis register set")
            return REGISTERS
        
        # Try alternative registers
        result = self.read_register(33057, 1)
        if result is not None:
            logger.info("Using alternative Solis register set")
            self.use_alt_registers = True
            return REGISTERS_ALT
        
        # Try holding registers
        result = self.read_holding_register(3004, 1)
        if result is not None:
            logger.info("Using holding registers")
            return REGISTERS
        
        logger.warning("Could not detect register set, using standard")
        return REGISTERS

    def read_all_data(self):
        """Read all configured registers and return as dictionary"""
        data = {
            'timestamp': datetime.now().isoformat(),
            'online': False
        }
        
        registers = REGISTERS_ALT if self.use_alt_registers else REGISTERS
        
        for name, reg_config in registers.items():
            # Handle both old format (4 items) and new format (5 items with signed flag)
            if len(reg_config) == 5:
                address, count, scale, unit, signed = reg_config
            else:
                address, count, scale, unit = reg_config
                signed = False
            
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
            return

        # Publish individual values
        for key, value in data.items():
            if not key.endswith('_unit') and key not in ['timestamp', 'online']:
                topic = f"{MQTT_TOPIC_PREFIX}/{key}"
                self.mqtt_client.publish(topic, str(value) if value is not None else "0", retain=True)

        # Publish combined JSON payload
        self.mqtt_client.publish(
            f"{MQTT_TOPIC_PREFIX}/status",
            json.dumps(data),
            retain=True
        )

        logger.info(f"Published: PV={data.get('pv_power', 'N/A')}W, "
                   f"Grid={data.get('grid_power', 'N/A')}W, "
                   f"Battery={data.get('battery_power', 'N/A')}W, "
                   f"SOC={data.get('battery_soc', 'N/A')}%, "
                   f"Load={data.get('house_load', 'N/A')}W")

    def run(self):
        """Main loop"""
        logger.info("Starting Solis Modbus to MQTT bridge...")
        
        # Connect to MQTT
        if not self.connect_mqtt():
            logger.error("Failed to connect to MQTT, exiting")
            return

        # Wait for MQTT connection
        time.sleep(2)

        while True:
            try:
                # Ensure Modbus connection
                if not self.connected_modbus:
                    if not self.connect_modbus():
                        logger.warning("Modbus not connected, retrying in 30s...")
                        time.sleep(30)
                        continue
                    # Auto-detect register set on first connect
                    self.detect_register_set()

                # Read and publish data
                data = self.read_all_data()
                self.publish_data(data)

                # If we got no data, reconnect
                if not data.get('online', False):
                    logger.warning("No data received, reconnecting...")
                    self.modbus_client.close()
                    self.connected_modbus = False
                    time.sleep(5)
                    continue

            except Exception as e:
                logger.error(f"Error in main loop: {e}")
                self.connected_modbus = False
                if self.modbus_client:
                    self.modbus_client.close()

            time.sleep(POLL_INTERVAL)

    def cleanup(self):
        """Clean up connections"""
        if self.modbus_client:
            self.modbus_client.close()
        if self.mqtt_client:
            self.mqtt_client.loop_stop()
            self.mqtt_client.disconnect()


def test_connection():
    """Test Modbus connection and read some registers"""
    logger.info(f"Testing connection to {SOLIS_IP}:{SOLIS_PORT}...")
    
    client = ModbusTcpClient(host=SOLIS_IP, port=SOLIS_PORT, timeout=10)
    
    if not client.connect():
        logger.error("Failed to connect!")
        return False
    
    logger.info("Connected! Testing registers (FC4 Input Registers)...")
    
    # Test key registers - format: (start_addr, count, description, scale, signed)
    test_registers = [
        (33057, 2, "PV Power", 1, False),          # U32
        (33130, 2, "Grid Power", 1, True),         # S32
        (33139, 1, "Battery SOC", 1, False),       # U16
        (33149, 2, "Battery Power", 1, True),      # S32
        (33147, 1, "House Load", 1, False),        # U16
        (33148, 1, "Backup Load", 1, False),       # U16
        (33093, 1, "Inverter Temp", 0.1, True),    # S16
        (33035, 1, "Daily Energy", 0.1, False),    # U16
        (33037, 1, "Monthly Energy", 1, False),    # U16
        (33039, 1, "Yearly Energy", 1, False),     # U16
        (33029, 2, "Total Energy", 1, False),      # U32
    ]
    
    for addr, count, desc, scale, signed in test_registers:
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
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "test":
        # Test mode - just check connection and registers
        test_connection()
    else:
        # Normal operation
        bridge = SolisModbusMQTT()
        try:
            bridge.run()
        except KeyboardInterrupt:
            logger.info("Shutting down...")
        finally:
            bridge.cleanup()
