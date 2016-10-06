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
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='VENTILATION_TEMP'", function (err, rows) {
        if (err !== null) {
            console.log(err);
        } else if (rows === undefined) {
            db.run('CREATE TABLE "VENTILATION_TEMP" ' +
                   '("timestamp" integer primary key,' +
                   '"outdoor" REAL,' +
                   '"supply" REAL,' +
                   '"exhaust" REAL,' +
                   '"waste" REAL);', function (err) {
                if (err !== null) {
                    console.log(err);
                } else {
                    console.log("SQL Table 'VENTILATION_TEMP' initialized.");
                }
            });
        } else {
            console.log("SQL Table 'VENTILATION_TEMP' already initialized.");
        }
    });

    // Database initialization for ventilation miscs
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='VENTILATION_MISC'", function (err, rows) {
          if (err !== null) {
            console.log(err);
          } else if (rows === undefined) {
              db.run('CREATE TABLE "VENTILATION_MISC" ' +
                     '("timestamp" integer primary key,' +
                     '"humidity" INTEGER,' +
                     '"humidity48hmean" INTEGER,' +
                     '"input" REAL,' +
                     '"output" REAL,' +
                     '"power" REAL);', function (err) {
                  if (err !== null) {
                      console.log(err);
                  } else {
                      console.log("SQL Table 'VENTILATION_MISC' initialized.");
                  }
              });
          } else {
              console.log("SQL Table 'VENTILATION_MISC' already initialized.");
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

db.close();

};

