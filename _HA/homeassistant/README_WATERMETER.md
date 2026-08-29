# Water Meter Setup with AI-on-the-Edge ESP32-CAM

Step-by-step guide to set up an AI-on-the-edge ESP32-CAM water meter with MQTT and Home Assistant utility meters.

---

## Prerequisites

- ESP32-CAM module (AI-Thinker recommended)
- USB-to-Serial adapter (FTDI) with **3.3V logic**
- Micro USB cable or 5V power supply
- Access to your MQTT broker (e.g., Mosquitto)
- Home Assistant with MQTT integration

---

## Part 1: Flash AI-on-the-Edge Firmware

### 1.1 Download Firmware

1. Go to: https://github.com/jomjol/AI-on-the-edge-device/releases
2. Download the latest `firmware.bin` and `html.zip`

### 1.2 Wiring for Flashing

Connect ESP32-CAM to FTDI adapter:

```
ESP32-CAM          FTDI Adapter
---------          ------------
5V       ------>   VCC (or external 5V)
GND      ------>   GND
U0R (RX) ------>   TX
U0T (TX) ------>   RX
GPIO0    ------>   GND (boot mode)
```

**IMPORTANT:** 
- FTDI must be set to **3.3V logic** (not 5V!)
- Cross TX↔RX connections
- GPIO0 must be connected to GND during power-up to enter flash mode

### 1.3 Flash with esptool

```bash
# Install esptool
pip install esptool

# Erase flash (optional but recommended for fresh start)
esptool.py --chip esp32 --port /dev/ttyUSB0 erase_flash

# Flash firmware
esptool.py --chip esp32 --port /dev/ttyUSB0 --baud 460800 \
  write_flash -z 0x1000 firmware.bin
```

### 1.4 First Boot

1. Disconnect GPIO0 from GND
2. Power cycle the ESP32-CAM
3. Connect to WiFi AP: `AI-on-the-edge` (password: usually empty or `12345678`)
4. Open browser: `http://192.168.4.1`
5. Configure your home WiFi credentials
6. Device reboots and connects to your network

---

## Part 2: Configure AI-on-the-Edge

### 2.1 Access Web Interface

Find the device IP in your router or use:
```bash
# Scan network
nmap -sn 192.168.100.0/24 | grep -i espressif
```

Open: `http://<device-ip>/`

### 2.2 Camera & Reference Setup

1. Go to **Settings → Reference Image**
2. Take a reference photo of your water meter
3. Define the **ROI (Region of Interest)** for digit recognition
4. Set the **PreValue** to match your current meter reading (e.g., `123.456`)
5. Configure **Decimal Shift** based on your meter (typically `-3` for m³)

### 2.3 MQTT Configuration

Go to **Settings → Configuration** and set:

```
[MQTT]
enabled = true
uri = mqtt://192.168.100.3:1883
maintopic = watermeter
clientid = watermeter-esp32
user = atnu
password = <your-mqtt-password>
HomeAssistant Discovery = true
Meter Type = Water Meter (m³)
```

**Key Settings:**
| Setting | Value | Description |
|---------|-------|-------------|
| `maintopic` | `watermeter` | Base MQTT topic |
| `HomeAssistant Discovery` | `true` | Auto-creates HA entities |
| `Meter Type` | `Water Meter (m³)` | Sets correct device class |

### 2.4 Set Meter Name

In the **Number Sequences** section, name your meter:
- Name: `water_m`

This creates MQTT topics like:
- `watermeter/water_m/value` - Current meter reading
- `watermeter/water_m/rate` - Flow rate
- `watermeter/water_m/error` - Error status

### 2.5 Test MQTT

Monitor MQTT messages:
```bash
mosquitto_sub -h 192.168.100.3 -u atnu -P <password> -t "watermeter/#" -v
```

Trigger a reading and you should see:
```
watermeter/water_m/value 123.456
watermeter/water_m/rate 0.000
watermeter/water_m/error no_error
```

---

## Part 3: Home Assistant Configuration

### 3.1 MQTT Integration

Ensure MQTT is configured in Home Assistant:
1. **Settings → Devices & Services → Add Integration → MQTT**
2. Enter broker details (192.168.100.3, port 1883, user, password)

### 3.2 Auto-Discovery

With `HomeAssistant Discovery = true`, entities are created automatically:
- `sensor.watermeter_value` - Main meter reading
- `sensor.watermeter_rate` - Flow rate

Check **Settings → Devices & Services → MQTT** for the watermeter device.

### 3.3 Utility Meters (configuration.yaml)

Add to your `configuration.yaml`:

```yaml
# Utility meters for water tracking
utility_meter:
  water_daily:
    source: sensor.watermeter_value
    name: "Water Daily"
    cycle: daily

  water_monthly:
    source: sensor.watermeter_value
    name: "Water Monthly"
    cycle: monthly

  water_yearly:
    source: sensor.watermeter_value
    name: "Water Yearly"
    cycle: yearly
```

### 3.4 Restart Home Assistant

**Settings → System → Restart**

---

## Part 4: Energy Dashboard

### 4.1 Add Water Source

1. Go to **Settings → Dashboards → Energy**
2. Under **Water consumption**, click **Add water source**
3. Select `sensor.watermeter_value`
4. Set **Cost entity** if you have water pricing configured (optional)
5. Click **Save**

### 4.2 View Dashboard

Go to **Energy** in the sidebar to see:
- Daily water consumption graph
- Monthly comparison
- Yearly statistics

---

## Troubleshooting

### Entity Not Appearing

1. Check MQTT connection in ESP32 web interface
2. Verify MQTT messages are being published:
   ```bash
   mosquitto_sub -h 192.168.100.3 -u atnu -P <password> -t "homeassistant/#" -v
   ```
3. Restart Home Assistant after MQTT discovery messages are sent

### Wrong Entity Name

The entity ID depends on your MQTT settings:
- Main topic: `watermeter`
- Meter name: `water_m`
- Results in: `sensor.watermeter_value` (may vary based on discovery config)

Check **Developer Tools → States** and search for `watermeter`.

### Reset Everything

**Clear retained MQTT messages:**
```bash
mosquitto_pub -h 192.168.100.3 -u atnu -P <password> -t "watermeter/water_m/value" -n -r
mosquitto_pub -h 192.168.100.3 -u atnu -P <password> -t "homeassistant/sensor/watermeter/water_m_value/config" -n -r
```

**Delete HA entity:**
1. **Settings → Devices & Services → MQTT**
2. Find watermeter device → Delete

**Clear statistics:**
1. **Developer Tools → Statistics**
2. Search `watermeter` → Clear statistics

**Reset utility meters:**
1. **Developer Tools → Actions**
2. Call `utility_meter.reset` on water_daily, water_monthly, water_yearly

### Set Initial Meter Value

On ESP32-CAM web interface or via REST:
```bash
curl "http://<device-ip>/setPreValue?value=123.456"
```

---

## MQTT Topic Reference

| Topic | Description | Example |
|-------|-------------|---------|
| `watermeter/water_m/value` | Current meter reading (m³) | `123.456` |
| `watermeter/water_m/rate` | Flow rate (m³/min) | `0.001` |
| `watermeter/water_m/error` | Error status | `no_error` |
| `watermeter/water_m/json` | All values as JSON | `{"value":"123.456","rate":"0.001"}` |
| `homeassistant/sensor/watermeter/*/config` | HA discovery config | JSON |

---

## Useful Links

- AI-on-the-edge GitHub: https://github.com/jomjol/AI-on-the-edge-device
- Documentation: https://jomjol.github.io/AI-on-the-edge-device-docs/
- Home Assistant MQTT: https://www.home-assistant.io/integrations/mqtt/
- Utility Meter: https://www.home-assistant.io/integrations/utility_meter/
