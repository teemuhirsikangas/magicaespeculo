"use strict";
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('./data/homeautomation.db');

module.exports.init = function () {

// Database initialization for homeautomation
    'use strict';
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='temperature'", function (err, rows) {
        if (err !== null) {
            console.log(err);
        } else if (rows === undefined) {
            db.run('CREATE TABLE "temperature" ' +
                   '("id" INTEGER PRIMARY KEY AUTOINCREMENT, ' +
                   '"floor" VARCHAR(255), ' +
                   '"room" VARCHAR(255), ' +
                   '"out" VARCHAR(255), ' +
                   '"humid" VARCHAR(255), ' +
                   '"timestamp" DATETIME)', function (err) {
                if (err !== null) {
                    console.log(err);
                } else {
                    console.log("SQL Table 'temperature' initialized.");
                }
            });

        } else {
            console.log("SQL Table 'temperature' already initialized.");
        }
    });


    // Database initialization
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='GARAGE_TEMP'", function (err, rows) {
        if (err !== null) {
            console.log(err);
        } else if (rows === undefined) {
              db.run('CREATE TABLE "GARAGE_TEMP" ' +
                     '("timestamp" integer primary key, ' +
                     '"garage_floor" VARCHAR(255), ' +
                     '"garage_floor2" VARCHAR(255), ' +
                     '"garage_room" VARCHAR(255), ' +
                     '"garage_humid" VARCHAR(255), ' +
                     '"storage_floor" VARCHAR(255), ' +
                     '"storage_room" VARCHAR(255), ' +
                     '"storage_humid" VARCHAR(255));', function (err) {
                  if (err !== null) {
                      console.log(err);
                  } else {
                    console.log("SQL Table 'GARAGE_TEMP' initialized.");
                  }
            });
        } else {
            console.log("SQL Table 'GARAGE_TEMP' already initialized.");
        }
    });


    // Database initialization for ground heat pump
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='DATASTORE_RAW'", function (err, rows) {
        if (err !== null) {
            console.log(err);
        } else if (rows === undefined) {
            db.run('CREATE TABLE "DATASTORE_RAW" ' +
                   '("TID" integer primary key, ' +
                   '"T_UTE" integer, ' +
                   '"T_FRAM" integer,' +
                   '"T_RETUR" integer,' +
                   '"T_VATTEN" integer, ' +
                   '"T_BRINE_IN" integer,' +
                   '"T_BRINE_UT" integer,' +
                   '"TS_P" integer,' +
                   '"KOMPR" integer,' +
                   '"VARMVATTEN" integer,' +
                   '"TRYCKR_T" integer,' +
                   '"CIRK_SPEED" integer,' +
                   '"BRINE_SPEED" integer,' +
                   '"COMPR_STARTS" integer,' +
                   '"HGW_VV" integer,' +
                   '"INTEGR_DIV" integer);', function (err) {
                if (err !== null) {
                    console.log(err);
                } else {
                    console.log("SQL Table 'DATASTORE_RAW' initialized.");
                }
            });
        } else {
            console.log("SQL Table 'DATASTORE_RAW' already initialized.");
        }
      });

    // Database initialization for ground heat pump statistics
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='DATASTORE_DAY'", function (err, rows) {
        if (err !== null) {
            console.log(err);
        } else if (rows === undefined) {
            db.run('CREATE TABLE "DATASTORE_DAY" ' +
                   '("TID" integer primary key,' +
                   '"T_UTE" integer,' +
                   '"T_UTE_MAX" integer,' +
                   '"T_UTE_MIN" integer,' +
                   '"T_VATTEN" integer,' +
                   '"TS_E" integer,' +
                   '"KOMPR_H" REAL,' +
                   '"VARMVATTEN_H" REAL,' +
                   '"COMPR_STARTS" integer,' +
                   '"T_VATTEN_MAX" integer,' +
                   '"T_VATTEN_MIN" integer);', function (err) {
                if (err !== null) {
                    console.log(err);
                } else {
                  console.log("SQL Table 'DATASTORE_DAY' initialized.");
                }
            });
        } else {
            console.log("SQL Table 'DATASTORE_DAY' already initialized.");
        }
        });

    // Database initialization for ventilation
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='VENTILATION'", function (err, rows) {
        if (err !== null) {
            console.log(err);
        } else if (rows === undefined) {
            db.run('CREATE TABLE "VENTILATION" ' +
                   '("timestamp" integer primary key,' +
                   '"fresh" integer,' +
                   '"supply_hr" integer,' +
                   '"supply" integer,' +
                   '"waste" integer,' +
                   '"exhaust" integer,' +
                   '"exhaust_humidity" integer,' +
                   '"hr_effiency_in" integer,' +
                   '"hr_efficiency_out" integer,' +
                   '"humidity_48h" integer,' +
                   '"control_state" integer,' +
                   '"heating_status" integer);', function (err) {
                if (err !== null) {
                    console.log(err);
                } else {
                    console.log("SQL Table 'VENTILATION' initialized.");
                }
            });
        } else {
            console.log("SQL Table 'VENTILATION' already initialized.");
        }
    });

    // Database initialization for electricity logging
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='ELECTRICITY_LOG'", function (err, rows) {
        if (err !== null) {
          console.log(err);
        } else if (rows === undefined) {
            db.run('CREATE TABLE "ELECTRICITY_LOG" ' +
                   '("timestamp" INTEGER primary key,' +
                   '"pulsecount" INTEGER NOT NULL DEFAULT 0,' +
                   '"watts" FLOAT NOT NULL DEFAULT 0);', function (err) {
                if (err !== null) {
                    console.log(err);
                } else {
                    console.log("SQL Table 'ELECTRICITY_LOG' initialized.");
                }
            });
        } else {
            console.log("SQL Table 'ELECTRICITY_LOG' already initialized.");
        }
    });

        // Database initialization
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='TECHNICAL_ROOM'", function (err, rows) {
        if (err !== null) {
            console.log(err);
        } else if (rows === undefined) {
              db.run('CREATE TABLE "TECHNICAL_ROOM" ' +
                     '("timestamp" integer primary key, ' +
                     '"technical_room" VARCHAR(255), ' +
                     '"technical_humid" VARCHAR(255));', function (err) {
                  if (err !== null) {
                      console.log(err);
                  } else {
                    console.log("SQL Table 'TECHNICAL_ROOM' initialized.");
                  }
            });
        } else {
            console.log("SQL Table 'TECHNICAL_ROOM' already initialized.");
        }
    });

    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='ENVOY_STATUS_REPORTS'", function (err, rows) {
        if (err !== null) {
            console.log(err);
        } else if (rows === undefined) {
              db.run('CREATE TABLE "ENVOY_STATUS_REPORTS" ' +
                     '("timestamp" INTEGER PRIMARY KEY, ' +
                     '"readingTime" INTEGER, ' +
                     '"wNow" INTEGER NOT NULL DEFAULT 0, ' +
                     '"wattHoursToday" INTEGER NOT NULL DEFAULT 0, ' +
                     '"wattHoursSevenDays" INTEGER NOT NULL DEFAULT 0, ' +
                     '"whLifetime" INTEGER NOT NULL DEFAULT 0);', function (err) {
                  if (err !== null) {
                      console.log(err);
                  } else {
                    console.log("SQL Table 'ENVOY_STATUS_REPORTS' initialized.");
                  }
            });
        } else {
            console.log("SQL Table 'ENVOY_STATUS_REPORTS' already initialized.");
        }
    });

        // Database initialization Enphase ENVOY-S data
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='ENVOY_INVERTER_STATUS'", function (err, rows) {
        if (err !== null) {
            console.log(err);
        } else if (rows === undefined) {
              db.run('CREATE TABLE "ENVOY_INVERTER_STATUS" ' +
                     '("id" INTEGER PRIMARY KEY AUTOINCREMENT, ' +
                     '"timestamp" INTEGER, ' +
                     '"serialNumber" INTEGER NOT NULL DEFAULT 0, ' +
                     '"lastReportWatts" INTEGER NOT NULL DEFAULT 0, ' +
                     '"maxReportWatts" INTEGER NOT NULL DEFAULT 0, ' +
                     '"lastReportDate" INTEGER, ' +
                     '"producing" INTEGER NOT NULL DEFAULT 0);', function (err) {
                  if (err !== null) {
                      console.log(err);
                  } else {
                    console.log("SQL Table 'ENVOY_INVERTER_STATUS' initialized.");
                  }
            });
        } else {
            console.log("SQL Table 'ENVOY_INVERTER_STATUS' already initialized.");
        }
    });


db.close();

};

