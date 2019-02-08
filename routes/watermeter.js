"use strict";
const express = require('express');
const router = express.Router();
const moment = require('moment');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/homeautomation.db');

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

    const starttime = req.params.starttime;
    const endtime = req.params.endtime;
    db.all('SELECT litercount FROM WATERMETER WHERE timestamp BETWEEN ' + starttime.getTime() + ' AND ' + endtime.getTime(), function (err, row) {
        if (err !== null) {
            res.json(err);
        } else {
            res.status(200).json(row);
        }
    });
});


router.get('/today', function (req, res, next) {

    let starttime = new Date();
    starttime.setHours(0,0,0,0);
    let endtime = new Date();
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

    let today = new Date();
    today.setHours(0,0,0,0);
    const msecPerDay = 24 * 60 * 60 * 1000;
    const startOfYesterday = new Date(today.getTime() - msecPerDay);
    today.setHours(24,0,0,0);
    const endOfYesterday = new Date(today.getTime() - msecPerDay);

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

    let today = new Date();
    today.setHours(0,0,0,0);
    const msecPerDay = 24 * 60 * 60 * 1000;
    const thirty1daysago = new Date(today.getTime() - msecPerDay * 31);
    today.setHours(24,0,0,0);
    const endOfYesterday = new Date(today.getTime() - msecPerDay);

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

    const litercount = req.body.litercount;
    const timestamp = new Date().getTime();
    //date = moment(new Date());
    //var datetime =  date.format("YYYY-MM-DD HH:mm:ss");
    const sqlRequest = "INSERT INTO 'WATERMETER' (timestamp, litercount) " +
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
