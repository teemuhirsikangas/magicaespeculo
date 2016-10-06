"use strict";
var express = require('express');
var router = express.Router();
var moment = require('moment');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('./data/homeautomation.db');

/* GET last values ventilation temp. */
router.get('/temperature', function (req, res, next) {

    db.all('SELECT * FROM VENTILATION_TEMP ORDER BY timestamp DESC LIMIT 1', function (err, row) {
        if (err !== null) {
            res.json(err);
        } else {
            //console.log(row);
            res.status(200).json(row);
        }
    });
});

/*
 * POST to add ventilation temperature data
 */
router.post('/temperature', function (req, res) {

    var outdoor = req.body.outdoor,
        supply = req.body.supply,
        exhaust = req.body.exhaust,
        waste = req.body.waste,
        timestamp = new Date().getTime(),
        sqlRequest = "INSERT INTO 'VENTILATION_TEMP' (timestamp, outdoor, supply, exhaust, waste) " +
                     "VALUES('" + timestamp + "', '" + outdoor + "','" + supply + "','" + exhaust + "','" + waste + "')";
    db.run(sqlRequest, function(err) {
        if (err !== null) {
            res.json(err);
        } else {
            res.json(201);
        }
    });
});


/* GET last values misc temp. */
router.get('/misc', function (req, res, next) {

    db.all('SELECT * FROM VENTILATION_MISC ORDER BY timestamp DESC LIMIT 1', function (err, row) {
        if (err !== null) {
            res.json(err);
        } else {
            res.status(200).json(row);
        }
    });
});

/*
 * POST to add ventilation misc data
 */
router.post('/misc', function (req, res) {

    var humidity = req.body.humidity,
        humidity48hmean = req.body.humidity48hmean,
        input = req.body.input,
        output = req.body.output,
        power = req.body.power,
        //datetime = req.body.datetime;
        timestamp = new Date().getTime(),
        sqlRequest = "INSERT INTO 'VENTILATION_MISC' (timestamp, humidity, humidity48hmean, input, output, power) " +
                   "VALUES('" + timestamp + "', '" + humidity + "','" + humidity48hmean + "','" + input + "','" + output + "','" + power + "')";
    db.run(sqlRequest, function (err) {
        if (err !== null) {
            res.json(err);
        } else {
            res.json(201);
        }
    });
});

module.exports = router;
