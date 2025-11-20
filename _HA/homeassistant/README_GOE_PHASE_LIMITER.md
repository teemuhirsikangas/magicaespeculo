# go-e Charger Phase Current Limiter for Home Assistant

Automatically limits go-e EV charger amperage based on P1 HAN power meter phase currents to prevent fuse overload (>25A).

## Features

- **Automatic protection**: Reduces charging by 2A steps when any phase exceeds 25A
- **Smart recovery**: Increases charging by 1A steps when all phases drop below 22A (waits 20 seconds)
- **Memory**: Remembers target amperage from `number.go_echarger_225812_amp` when car starts charging
- **Continuous monitoring**: Checks every 20 seconds during active charging
- **Notifications**: Persistent notification when overload reduction occurs

## Requirements

- **Home Assistant** (tested with 2024.x+)
- **go-e Charger MQTT Integration**: https://github.com/syssi/homeassistant-goecharger-mqtt
- **P1 HAN power meter** with phase current sensors:
  - `sensor.current_phase_1`
  - `sensor.current_phase_2`
  - `sensor.current_phase_3`
- **go-e charger entities** (from MQTT integration):
  - `binary_sensor.go_echarger_225812_car` (car connected)
  - `sensor.go_echarger_225812_car` (charging status: "Charging", "Ready", etc.)
  - `number.go_echarger_225812_amp` (amperage control - **actual charging current**)

## Installation

### Step 0: Install go-e Charger MQTT Integration

1. **Install via HACS** (recommended):
   - Open HACS → Integrations
   - Click **⋮** (three dots) → **Custom repositories**
   - Add: `https://github.com/syssi/homeassistant-goecharger-mqtt`
   - Category: **Integration**
   - Click **Add**
   - Find "go-eCharger (MQTT)" and install

2. **Configure MQTT connection**:
   - Settings → Devices & Services → **Add Integration**
   - Search for "go-eCharger MQTT"
   - Enter your MQTT broker details:
     - Broker: Your MQTT IP (e.g., `192.168.100.3`)
     - Username/Password: Your MQTT credentials
     - go-e Charger Serial: Your charger ID (e.g., `225812`)

3. **Verify entities**:
   - Go to Settings → Devices & Services → go-eCharger
   - Check entities exist:
     - `binary_sensor.go_echarger_225812_car`
     - `sensor.go_echarger_225812_car`
     - `number.go_echarger_225812_amp`

### Step 1: Add Template Sensors

Add to `configuration.yaml`:

```yaml
template: !include goe_phase_limiter_templates.yaml
```

Copy `goe_phase_limiter_templates.yaml` to your Home Assistant config directory.

### Step 2: Add Input Number

Add to `configuration.yaml`:

```yaml
input_number: !include goe_phase_limiter_input_number.yaml
```

Copy `goe_phase_limiter_input_number.yaml` to your Home Assistant config directory.

### Step 3: Add Automations

Copy the automation configuration from `automations.yaml` in this directory.

Add to your Home Assistant `automations.yaml` or via the UI:
- **Settings** → **Automations & Scenes** → **Create Automation** → **Edit in YAML**
- Paste each automation (4 total: init, reduce, increase, monitor)

### Step 4: Restart Home Assistant

1. Go to **Developer Tools** → **YAML**
2. Click **Check Configuration**
3. If valid, click **Restart** → **Restart Home Assistant**

## Configuration

### Adjust Thresholds

Edit `goe_phase_limiter_templates.yaml` to change limits:

```yaml
# Change 25A overload threshold
{% if max_current > 25 %}  # Change this value

# Change 22A safe threshold
{% elif max_current < 22 %}  # Change this value
```

### Adjust Amperage Range

Edit `goe_phase_limiter_input_number.yaml`:

```yaml
min: 6    # Minimum charging amperage
max: 16   # Maximum charging amperage
step: 1   # Adjustment step size
```

### Adjust Reduction/Increase Steps

Edit `goe_phase_limiter_automations.yaml`:

```yaml
# Reduce by 2A (change - 2)
value: {{ [states('number...') | float - 2, 6] | max }}

# Increase by 1A (change + 1)
value: {{ [states('number...') | float + 1, ...] | min }}
```

### Adjust Monitoring Interval

Edit the monitor automation trigger:

```yaml
trigger:
  - platform: time_pattern
    seconds: "/20"  # Check every 20 seconds (change to /30 or /60 for slower monitoring)
```

## Testing

1. **Check template sensors**:
   - Go to **Developer Tools** → **States**
   - Find `sensor.max_phase_current` - should show current max phase value
   - Find `sensor.phase_overload_status` - should show `normal`, `safe`, or `overload`

2. **Monitor automation**:
   - Go to **Settings** → **Automations & Scenes**
   - Find the 4 go-e automations:
     - "go-e: Set desired Target Amp" (initialization)
     - "go-e: Reduce Charging on Overload >25A" (overload protection)
     - "go-e: Increase Charging When Safe" (recovery)
     - "go-e: Monitor Phase Currents" (continuous monitoring)
   - Ensure all are enabled
   - Check automation traces after charging to verify behavior

3. **Test behavior**:
   - Start charging your car
   - Monitor `input_number.goe_charger_target_amps` - should initialize to current limit
   - Load your house to push one phase above 25A
   - Verify charging amperage reduces automatically
   - Reduce house load below 22A on all phases
   - Verify charging amperage increases gradually

## Troubleshooting

### Automations not triggering

- Verify all entity IDs match your go-e charger serial number
- Check entity names in **Developer Tools** → **States**:
  - `binary_sensor.go_echarger_XXXXXX_car` (car connected)
  - `sensor.go_echarger_XXXXXX_car` (charging status)
  - `number.go_echarger_XXXXXX_amp` (amperage control)
- Ensure P1 HAN phase current sensors exist and update regularly
- Verify MQTT integration is working (check go-e entities are updating)

### Template sensors showing "unavailable"

- Check that `sensor.current_phase_1/2/3` exist in your system
- Verify sensors are returning numeric values (not "unknown" or "unavailable")

### Charging not reducing when phase overload occurs

- Check automation trace to see if conditions failed
- Verify `sensor.go_echarger_225812_car` state is exactly "Charging" (case-sensitive)
- Ensure minimum amperage (6A) hasn't been reached

### Conflict with solar surplus automation

If you have existing `chargelimit.yaml` for solar surplus charging:
- This phase limiter has **priority** - it will override solar surplus limits during overload
- Solar automation can still increase charging during high solar production
- Phase limiter will reduce immediately if overload occurs regardless of solar surplus

## How It Works

1. **Initialization**: When car starts charging (`sensor.go_echarger_225812_car` = "Charging"), reads current `number.go_echarger_225812_amp` value and stores in `input_number.goe_charger_target_amps`

2. **Overload Detection**: Template sensor `sensor.max_phase_current` continuously calculates max of three phase currents (rounded to 1 decimal)

3. **Status Classification**:
   - `overload`: Any phase > 25A → trigger immediate reduction
   - `safe`: All phases < 22A → allow gradual increase after 20 seconds
   - `normal`: Between 22-25A → maintain current setting

4. **Reduction**: When overload detected, reduce by 2A (minimum 6A), send persistent notification

5. **Recovery**: When safe for 20+ seconds AND car still charging, increase by 1A (up to stored target from initialization)

6. **Monitoring**: Every 20 seconds, check if phase overload exists during charging and reduce if needed (additional safety check)

## Credits

Created for magicaespeculo home automation project.
