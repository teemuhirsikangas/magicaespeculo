"use strict";
var express = require('express');
var router = express.Router();
var moment = require('moment');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('./data/homeautomation.db');


router.get('/', function (req, res, next) {

    db.all('SELECT * FROM ENVOY_STATUS_REPORTS ORDER BY timestamp DESC LIMIT 1', function (err, row) {
        if (err !== null) {
            res.json(err);
        } else {

            var timestamp = 0;
            if(row != null && row  != undefined && row[0] != null) {
                timestamp = row[0].timestamp;
            }
            db.all('SELECT * FROM ENVOY_INVERTER_STATUS WHERE timestamp = '+ timestamp + '  ORDER BY timestamp DESC LIMIT 9', function (err, row2) {

            row.push({ "inverters" : row2});
            res.status(200).json(row);
            });
        }
    });
    
});

/* GET last values from status report listing. */
router.get('/latest', function (req, res, next) {

    db.all('SELECT * FROM  ENVOY_STATUS_REPORTS t1 INNER JOIN ENVOY_INVERTER_STATUS t2 ON t1.timestamp = t2.timestamp  ORDER BY timestamp DESC LIMIT 9', function (err, row) {
        if (err !== null) {
           res.json(err);
        } else {
            res.status(200).json(row);
        }
    });
});

/* GET last values from inverters listing. */
router.get('/latestinv', function (req, res, next) {

    db.all('SELECT * FROM ENVOY_INVERTER_STATUS ORDER BY timestamp DESC LIMIT 9', function (err, row) {
        if (err !== null) {
           res.json(err);
        } else {
            res.status(200).json(row);
        }
    });
});
//today
router.get('/today', function (req, res, next) {

    var startOfToday = new Date();
    startOfToday.setHours(0,0,0,0);
    var now = new Date();
    db.all('SELECT * FROM ENVOY_STATUS_REPORTS WHERE timestamp BETWEEN ' + startOfToday.getTime() + ' AND ' + now.getTime() + ' ORDER BY timestamp ASC', function (err, row) {
        if (err !== null) {
            res.json(err);
        } else {
            res.status(200).json(row);
        }
    });
});


//watthours yesterday
router.get('/yesterday', function (req, res, next) {

    var today = new Date();
    today.setHours(0,0,0,0);
    var msecPerDay = 24 * 60 * 60 * 1000;
    var startOfYesterday = new Date(today.getTime() - msecPerDay);
    today.setHours(24,0,0,0);
    var endOfYesterday = new Date(today.getTime() - msecPerDay);
    db.all('SELECT * FROM ENVOY_STATUS_REPORTS WHERE timestamp BETWEEN ' + startOfYesterday.getTime() + ' AND ' + endOfYesterday.getTime() + ' ORDER BY timestamp ASC', function (err, row) {
        if (err !== null) {
            res.json(err);
        } else {
            res.status(200).json(row);
        }
    });
});


/*
 * POST to add solar inverter data, data is polled every 60secs, but inverter currently gives new data every 5-15 minutes. checking if data with same readingTime already exists before adding new data
 */
router.post('/', function (req, res) {

    var wattHoursToday = req.body.wattHoursToday,
        readingTime = req.body.readingTime,
        wNow = req.body.wNow,
        wattHoursSevenDays = req.body.wattHoursSevenDays,
        whLifetime = req.body.whLifetime,
        timestamp = new Date().getTime(),
        inverters = req.body.inverters;
        
    checkDuplicateData ( function(row) {
    if(row != null && row  != undefined && row[0] != null && (parseInt(readingTime) === parseInt(row[0].readingTime))) {
        //console.log("Data already found, NOP");
        res.json(304);
        return;

    } else {
        //add status data
        var sqlRequest = "INSERT INTO 'ENVOY_STATUS_REPORTS' (timestamp, readingTime, wNow, whLifetime, wattHoursSevenDays, wattHoursToday) " +
                    "VALUES('" + timestamp + "', '" + readingTime + "','" + wNow + "','" + whLifetime + "','" + wattHoursSevenDays + "','"  + wattHoursToday + "')";

        db.run(sqlRequest, function (err) {
            if (err !== null) {
                res.json(err);
            } else {
                //Add status data for all inverters
                for (var i = 0; i <= inverters.length - 1; i++) {

                    var serialNumber = inverters[i].serialNumber,
                        lastReportWatts = inverters[i].lastReportWatts,
                        maxReportWatts = inverters[i].maxReportWatts,
                        lastReportDate = inverters[i].lastReportDate,
                        producing = inverters[i].producing ? 1 : 0;

                    var sqlRequestInv = "INSERT INTO 'ENVOY_INVERTER_STATUS' (timestamp, serialNumber, lastReportWatts, maxReportWatts, lastReportDate, producing) " +
                         "VALUES('" + timestamp + "', '" + serialNumber + "','" + lastReportWatts + "','" + maxReportWatts + "','" + lastReportDate + "','" + producing + "')";
                    db.run(sqlRequestInv);
                }
                 res.json(201);
            }
        });        

        }       
    });
});                  

module.exports = router;

function checkDuplicateData(cb) {
    db.all('SELECT readingTime FROM ENVOY_STATUS_REPORTS ORDER BY timestamp DESC LIMIT 1', function(err, row) {
        return cb(row);
    });

};