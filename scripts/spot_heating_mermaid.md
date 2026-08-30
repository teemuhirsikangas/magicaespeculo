# Spot Price Heating Control Flow

## System Overview

```mermaid
flowchart TB
    subgraph CRON["⏰ Cron Jobs (every 15 min)"]
        C1[spot_prices.py]
        C2[thermia.py]
    end

    subgraph SPOT["spot_prices.py - EVU Control"]
        API[api.spot-hinta.fi] --> FETCH[Fetch Spot Price]
        FETCH --> CHECK{Rank ≤ CHEAPESTHOURS<br/>OR<br/>Price ≤ ALLOWPRICE?}
        CHECK -->|YES| EVU1[EVU = 1<br/>Enable heating]
        CHECK -->|NO| EVU0[EVU = 0<br/>Disable heating]
        EVU1 --> PUB1[Publish to MQTT]
        EVU0 --> PUB1
        PUB1 --> MQTT_EVU[home/engineroom/heatpumpevu]
        PUB1 --> MQTT_SPOT[home/engineroom/spotprice<br/>includes ComfortPriceLimit]
    end

    subgraph THERMIA["thermia.py - Comfort/ECO Control"]
        READ[Read spotprice from MQTT] --> TIMECHECK{Time within<br/>allowed window?}
        TIMECHECK -->|Summer Apr-Sep| SUMMER[09:00-18:00]
        TIMECHECK -->|Winter Oct-Mar| WINTER[22:00-07:00]
        SUMMER --> PRICECHECK
        WINTER --> PRICECHECK
        PRICECHECK{Price ≤<br/>COMFORTPRICE?} -->|NO| ECO[ECO Mode<br/>19°C]
        PRICECHECK -->|YES| TEMPCHECK{Outdoor ≤<br/>COMFORTDISABLETEMP?}
        TEMPCHECK -->|NO| ECO
        TEMPCHECK -->|YES| INTCHECK{Integral ≥<br/>INTEGRAL_LIMIT?}
        INTCHECK -->|NO| ECO
        INTCHECK -->|YES| COMFORT[COMFORT Mode<br/>20°C]
        COMFORT --> WRITE[Write to ThermIQ<br/>via Modbus]
        ECO --> WRITE
        WRITE --> MQTT_HP[home/engineroom/heatpump]
    end

    subgraph HP["Thermia Heat Pump"]
        EVU_INPUT[EVU Input<br/>Compressor Block]
        ROOM_TARGET[Room Target Temp]
    end

    MQTT_EVU -.->|GPIO/Relay| EVU_INPUT
    WRITE --> ROOM_TARGET

    subgraph CONFIG["config.py Settings"]
        direction LR
        CFG1[CHEAPESTHOURS]
        CFG2[ALLOWPRICE]
        CFG3[COMFORTPRICE]
        CFG4[WINTER_ALLOWED 22-07]
        CFG5[SUMMER_ALLOWED 09-18]
        CFG6[TARGET_TEMP=20]
        CFG7[ECO_TEMP=19]
    end

    style MQTT_EVU fill:#f9f,stroke:#333
    style MQTT_SPOT fill:#f9f,stroke:#333
    style MQTT_HP fill:#f9f,stroke:#333
    style COMFORT fill:#90EE90
    style ECO fill:#87CEEB
    style EVU1 fill:#90EE90
    style EVU0 fill:#FFB6C1
```

## Script Responsibilities

| Script | Controls | Logic |
|--------|----------|-------|
| **spot_prices.py** | EVU (compressor block) | Rank ≤ CHEAPESTHOURS **OR** Price ≤ ALLOWPRICE |
| **thermia.py** | Target temperature | Time window **AND** Price ≤ COMFORTPRICE **AND** Outdoor temp **AND** Integral |

## Config Settings Quick Reference

### spot_prices.py settings
- `CHEAPESTHOURS` - Allow heating during X cheapest hours (1-24). Set 24 to always allow
- `ALLOWPRICE` - Always allow heating if spot price ≤ this (EUR/kWh)
- `COMFORTPRICE` - Published to MQTT for thermia.py to use

### thermia.py settings
- `SUMMER_ALLOWED_START/STOP` - Time window for summer comfort (Apr-Sep)
- `WINTER_ALLOWED_START/STOP` - Time window for winter comfort (Oct-Mar)
- `TARGET_TEMP` - Comfort mode target (°C)
- `ECO_TEMP` - ECO mode target (°C)
- `INTEGRAL_LIMIT` - Don't enable comfort if integral < this (prevents aux heater)
- `COMFORTDISABLETEMP` - Disable comfort if outdoor temp > this

## Fixed Electricity Contract Mode

When using a fixed price contract, manually set:
```python
CHEAPESTHOURS = 24      # EVU always enabled
COMFORTPRICE = 0.50     # Comfort always passes price check
```

Comfort heating will still only activate during the configured time windows (22:00-07:00 in winter).
