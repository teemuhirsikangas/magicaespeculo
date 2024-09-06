# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]
- Remove/refactor ifttt lib, as it's using deprecated punycode dep

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
