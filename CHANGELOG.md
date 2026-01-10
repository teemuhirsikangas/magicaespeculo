# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]
- Remove/refactor ifttt lib, as it's using deprecated punycode dep

## [1.4.42] - 2026-01-10
### Changed
- nodejs 24.x

## [1.4.41] - 2026-01-09
### Added
- Added script to check garage temperature every 2mins and notify via Gotify when it goes to low (to prevent accidental garage door left open in winter)

## [1.4.40] - 2026-01-02
### Added
- Added postal delivery dates display using Posti API
- Added posti.fi logo from https://digilibrary.emmi.fi/f/FJPx
- Update deps

## [1.4.39] - 2025-11-22
### Added
- EV charging duration display with live timer updates for go-e charger (tab + cdi registers)
- Solar surplus display showing real-time surplus power (export - import) from Home Assistant
- Phase indicator (1x/3x) for EV charging current display in grey

## [1.4.38] - 2025-11-20
### Added
- EV charging status from go-e charger via MQTT to show if charging is allowed or limited due to phase current limiter script and other status info

## [1.4.37] - 2025-11-19
### Added
- track daily energy import/export from HAN meter via home assistant REST api
- fix melcloud mitshubishi heat pump energy usage reading
- Add https://github.com/syssi/homeassistant-goecharger-mqtt for go-e charger phase current limiting scripts via Home assistant and show car charging status in UI

## [1.4.36] - 2025-10-02
### Added
- fix spot-price 3rd party api to use 60min interval parameter for heatpump evu control
- Show spotprice for 15min interval in UI
- update deps

## [1.4.35] - 2025-09-03
### Added
- Update deps

## [1.4.34] - 2025-07-03
### Added
- refactor googleapis to work with major version change
- update deps
- remove IFTTT package

## [1.4.33] - 2024-12-11
### Added
- Electricity price per h and day, will take account cheaper night transferprice + base montly price
- Update deps

## [1.4.32] - 2024-10-04
### Added
- Add Mitshubishi air heat pump status info from yard sauna via melCloud

## [1.4.31] - 2024-10-02
### Added
- Heatpump adjustment tweaks. Script to command ground heat pump via ThermIQ serial to increase +2 degrees indoor temperature to reserve heat during low spot electric prices. Comfort mode, or ECO mode.
logig:
spot_prices.py will send the spot price + limits via MQTT
config.py:  allowed time between XX-YY
            outdoor temp limit, in summer time no need to heat to comfort mode
            ghp integral, allow comfort mode only when integral >-150, so no aux heater doesn't come ON
thermia.py will check the sport price MQTT, communicate with thermIQ serial, update values to UI via MQTT


## [1.4.30] - 2024-09-06
### Added
- script to fetch power import/export from home assistant via REST, to publish back to MQTT
- Show these in UI

## [1.4.29] - 2024-09-03
### Added
- Added changelog file
### Changed
- Update jquery, fontawesome, moment
- Refactor bin/www file into index.js file and pm2 startup docs
- refactor package.json file
- Copy changes from readme file:
    Changes:
    17.10.2016 - Added backup script
    1.2.2017 - Added Enervent Ventilation unit
    15.3.2017 - Added Wiring diagrams and updated dependencies
    07.07.2017 - Added Enphase Envoy-s data for solar production
    22.02.2018 - Added watermeter DB and placeholder for UI
    02.03.2018 - Added MQTT client sub, for watermeter data
    15.3.2018 - Added socket.io for realtime MQTT message: water leak, water consumption, front and garade door status, set/get alarm status
    30.5.2018 - Added Emphase envoy inverters to 3 phases and sort the microinverter arrays to same layout as in the roof
    12.6.2018 - Added rtl_433 door sensors and mqtt handler, IFTT push notifications moved from python script to node
    12.8.2018 Added greenhouse temp, humid and vbatt logging to db via mqtt message
    3.2.2019 Changed to use Dark Sky weather api
    8.2.2019 Added darkSky api to prevent corrs from clientside js, lint fixes
    17.9.2021 Fix migrate to work with bootsrap 5, update deps
    30.9.2022 Upgrade to awesomefont 6.x, stop animation as Rasperry pi cpu+firefox cannot handle those
    18.10.2022 update deps
    13.11.2022 add electricy price toggle + update deps
    14.12.2022 pir.py fix to work on python3 and debian bullseye. (todo: update rest of the scripts and stuff to work on bullseye)
    03.04.2023 dark sky close, move to openweather
    04.10.2023 move ESP8266 scripts to this repo. ground heat pump evu control based on electric spot prices in
    Finland
    [esp8266code](_iot_devices/esp8266/README.md)
    11.10.2023 Add Spot electric prices, and heatpump evu status if heating is allowed or not
    22.12.2023 nodejs 20, update deps
    17.06.2024 nodejs 22
