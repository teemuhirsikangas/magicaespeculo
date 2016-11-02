"use strict";
var express = require('express');
var router = express.Router();
var moment = require('moment');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('./data/homeautomation.db');

/* GET last values electricity. */
router.get('/', function (req, res, next) {

    db.all('SELECT timestamp,pulsecount FROM ELECTRICITY_LOG ORDER BY timestamp ASC', function (err, row) {
        if (err !== null) {
            res.json(err);
        } else {
            res.status(200).json(row);
        }
    });
});


/* GET last pulsecount electricity. */
router.get('/now', function (req, res, next) {

    db.all('SELECT timestamp, pulsecount FROM ELECTRICITY_LOG ORDER BY timestamp DESC limit 1', function (err, row) {
        if (err !== null) {
            res.json(err);
        } else {
            res.status(200).json(row);
        }
    });
});

/* GET hourly electric values for start of hour */
router.get('/hourly', function (req, res, next) {

    db.all('SELECT strftime("%Y-%m-%d %H:00:00", timestamp/1000, "unixepoch", "localtime") as date, sum(pulsecount) as wh FROM ELECTRICITY_LOG GROUP BY date ORDER BY date ASC', function (err, row) {
        if (err !== null) {
            res.json(err);
        } else {
            //console.log(row);
            res.status(200).json(row);
        }
    });
});


/* GET daily wh usage */
router.get('/dailyusage', function (req, res, next) {

    db.all('SELECT date(timestamp/1000, "unixepoch", "localtime") as date, sum(pulsecount) as wh FROM ELECTRICITY_LOG GROUP BY date ORDER BY date ASC', function (err, row) {
        if (err !== null) {
            res.json(err);
        } else {
            res.status(200).json(row);
        }
    });
});

/* GET last values electricity. */
router.get('/:starttime/:endtime', function (req, res, next) {

    var starttime = req.params.starttime;
    var endtime = req.params.endtime;
    db.all('SELECT pulsecount FROM ELECTRICITY_LOG WHERE timestamp BETWEEN ' + starttime.getTime() + ' AND ' + endtime.getTime(), function (err, row) {
        if (err !== null) {
            res.json(err);
        } else {
            res.status(200).json(row);
        }
    });
});


router.get('/today', function (req, res, next) {

    var starttime = new Date();
    starttime.setHours(0,0,0,0);
    var endtime = new Date();
    endtime.setHours(24,0,0,0);
    db.all('SELECT SUM(pulsecount) as Wh FROM ELECTRICITY_LOG WHERE timestamp BETWEEN ' + starttime.getTime() + ' AND ' + endtime.getTime(), function (err, row) {
        if (err !== null) {
            res.json(err);
        } else {
            res.status(200).json(row);
        }
    });
});

router.get('/yesterday', function (req, res, next) {

    var today = new Date();
    today.setHours(0,0,0,0);
    var msecPerDay = 24 * 60 * 60 * 1000;
    var startOfYesterday = new Date(today.getTime() - msecPerDay);
    today.setHours(24,0,0,0);
    var endOfYesterday = new Date(today.getTime() - msecPerDay);

    db.all('SELECT SUM(pulsecount) as Wh FROM ELECTRICITY_LOG WHERE timestamp BETWEEN ' + startOfYesterday.getTime() + ' AND ' + endOfYesterday.getTime(), function (err, row) {
        if (err !== null) {
            res.json(err);
        } else {
            res.status(200).json(row);
        }
    });
});

/*
 * POST to add electricity data
 */
router.post('/', function (req, res) {

    var pulsecount = req.body.pulsecount;
    var watts = req.body.watts;
    var timestamp = new Date().getTime();
    //date = moment(new Date());
    //var datetime =  date.format("YYYY-MM-DD HH:mm:ss");
    var sqlRequest = "INSERT INTO 'ELECTRICITY_LOG' (timestamp, pulsecount, watts) " +
                 "VALUES('" + timestamp + "', '" + pulsecount + "','" + watts + "')";
    //console.log(sqlRequest);             
    db.run(sqlRequest, function (err) {
        if (err !== null) {
            res.json(err);
        } else {
            res.json(201);
        }
    });
});

module.exports = router;
