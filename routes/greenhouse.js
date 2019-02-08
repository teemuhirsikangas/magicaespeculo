"use strict";
const express = require('express');
const router = express.Router();
const moment = require('moment');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/homeautomation.db');


router.get('/', function (req, res, next) {

    db.all('SELECT * FROM GREENHOUSE_TEMP ORDER BY timestamp', function (err, row) {
        if (err !== null) {
            res.json(err);
        } else {
            //console.log(row);
            res.status(200).json(row);
        }
    });
});

/* GET last values homeautomation listing. */
router.get('/temperature', function (req, res, next) {

    db.all('SELECT * FROM GREENHOUSE_TEMP ORDER BY timestamp DESC LIMIT 1', function (err, row) {
        if (err !== null) {
           res.json(err);
        } else {
            res.status(200).json(row);
        }
    });
});

/* GET temperature values for start of hour */
router.get('/temperature/hourly', function (req, res, next) {

    db.all('SELECT strftime("%Y-%m-%d %H:00:00", timestamp/1000, "unixepoch", "localtime") as date, temp, humid, vbatt FROM GREENHOUSE_TEMP GROUP BY date ORDER BY date ASC', function (err, row) {
        if (err !== null) {
            res.json(err);
        } else {
            //console.log(row);
            res.status(200).json(row);
        }
    });
});


/*
 * POST to add temperature data
 */
router.post('/temperature', function (req, res) {
    //timestamp = req.body.timestamp;
    const temp = req.body.temp,
        humid = req.body.humid,
        vbatt = req.body.vbatt
        timestamp = new Date().getTime(),
        sqlRequest = "INSERT INTO 'GREENHOUSE_TEMP' (timestamp, temp, humid, vbatt) " +
                 "VALUES('" + timestamp + "', '" + temp + "','" + humid + "','" + vbatt + "')"

    db.run(sqlRequest, function (err) {
        if (err !== null) {
            res.json(err);
        } else {
            res.json(201);
        }
    });
    //res.render('index', req.body);
});

module.exports = router;
