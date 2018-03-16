"use strict";
var express = require('express');
var router = express.Router();
var moment = require('moment');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('./data/homeautomation.db');

/* GET last values. */
router.get('/', function (req, res, next) {

    db.all('SELECT timestamp,litercount FROM WATERMETER ORDER BY timestamp ASC', function (err, row) {
        if (err !== null) {
            res.json(err);
        } else {
            res.status(200).json(row);
        }
    });
});

/* GET minute liter values for start of minute */
router.get('/minutes', function (req, res, next) {

    db.all('SELECT strftime("%Y-%m-%d %H:%M:00", timestamp/1000, "unixepoch", "localtime") as date, sum(litercount) as liters FROM WATERMETER GROUP BY date ORDER BY date ASC', function (err, row) {
        if (err !== null) {
            res.json(err);
        } else {
            res.status(200).json(row);
        }
    });
});


/* GET hourly liter values for start of hour */
router.get('/hourly', function (req, res, next) {

    db.all('SELECT strftime("%Y-%m-%d %H:00:00", timestamp/1000, "unixepoch", "localtime") as date, sum(litercount) as liters FROM WATERMETER GROUP BY date ORDER BY date ASC', function (err, row) {
        if (err !== null) {
            res.json(err);
        } else {
            res.status(200).json(row);
        }
    });
});


/* GET daily water usage */
router.get('/dailyusage', function (req, res, next) {

    db.all('SELECT date(timestamp/1000, "unixepoch", "localtime") as date, sum(litercount) as liters FROM WATERMETER GROUP BY date ORDER BY date ASC', function (err, row) {
        if (err !== null) {
            res.json(err);
        } else {
            res.status(200).json(row);
        }
    });
});

/* GET last values. */
router.get('/:starttime/:endtime', function (req, res, next) {

    var starttime = req.params.starttime;
    var endtime = req.params.endtime;
    db.all('SELECT litercount FROM WATERMETER WHERE timestamp BETWEEN ' + starttime.getTime() + ' AND ' + endtime.getTime(), function (err, row) {
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
    db.all('SELECT timestamp, COUNT(litercount) as liters FROM WATERMETER WHERE timestamp BETWEEN ' + starttime.getTime() + ' AND ' + endtime.getTime(), function (err, row) {
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

    db.all('SELECT COUNT(litercount) as liters FROM WATERMETER WHERE timestamp BETWEEN ' + startOfYesterday.getTime() + ' AND ' + endOfYesterday.getTime(), function (err, row) {
        if (err !== null) {
            res.json(err);
        } else {
            res.status(200).json(row);
        }
    });
});

//this year

//last 30day daily avarage
router.get('/thirtydayavarage', function (req, res, next) {

    var today = new Date();
    today.setHours(0,0,0,0);
    var msecPerDay = 24 * 60 * 60 * 1000;
    var thirty1daysago = new Date(today.getTime() - msecPerDay * 31);
    today.setHours(24,0,0,0);
    var endOfYesterday = new Date(today.getTime() - msecPerDay);

    db.all('SELECT ROUND(SUM(litercount)/30,1) as liters FROM WATERMETER WHERE timestamp BETWEEN ' + thirty1daysago.getTime() + ' AND ' + endOfYesterday.getTime(), function (err, row) {
        if (err !== null) {
            res.json(err);
        } else {
            res.status(200).json(row);
        }
    });
});


/*
 * POST to add watermeter data
 */
router.post('/', function (req, res) {

    var litercount = req.body.litercount;
    var timestamp = new Date().getTime();
    //date = moment(new Date());
    //var datetime =  date.format("YYYY-MM-DD HH:mm:ss");
    var sqlRequest = "INSERT INTO 'WATERMETER' (timestamp, litercount) " +
                 "VALUES('" + timestamp + "','" + litercount + "')";
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
