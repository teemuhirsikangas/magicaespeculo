# Water Meter Reader

## Current Setup: AI-on-the-edge (ESP32-CAM)

The water meter is read using [AI-on-the-edge](https://github.com/jomjol/AI-on-the-edge-device) running on an ESP32-CAM module with camera-based OCR.

### Device Access
- **Web UI**: http://watermeter.local/index.html#
- Uses **mDNS** hostname - more reliable than DHCP IP

### Home Assistant Integration
Data is sent to Home Assistant via MQTT and exposed as sensors:
- `sensor.watermeter_value` - Total meter reading (m³)
- `sensor.watermeter_rate_per_time_unit` - Flow rate (m³/h)

### Configuration in magicaespeculo
- **Server config** (`config.js`): `watermeter.pricePerCubicMeter` - water price €/m³
- **Frontend config** (`public/javascripts/config.js`): `watermeter.deviceUrl` - ESP32 web UI URL
