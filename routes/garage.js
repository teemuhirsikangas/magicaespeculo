"use strict";
var express = require('express');
var router = express.Router();
var moment = require('moment');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('./data/homeautomation.db');


router.get('/', function (req, res, next) {

    db.all('SELECT * FROM GARAGE_TEMP ORDER BY timestamp', function (err, row) {
        if (err !== null) {
            res.json(err);
        } else {
            //console.log(row);
            res.json(200, row);
        }
    });
});

/* GET last values homeautomation listing. */
router.get('/temperature', function (req, res, next) {

    db.all('SELECT * FROM GARAGE_TEMP ORDER BY timestamp DESC LIMIT 1', function (err, row) {
        if (err !== null) {
           res.json(err);
        } else {
            res.status(200).json(row);
        }
    });
});

/* GET temperature values for start of hour */
router.get('/temperature/hourly', function (req, res, next) {

    db.all('SELECT strftime("%Y-%m-%d %H", timestamp/1000, "unixepoch", "localtime") as date, garage_floor, garage_floor2, garage_room, garage_humid, storage_floor, storage_room, storage_humid FROM GARAGE_TEMP GROUP BY date ORDER BY date ASC', function (err, row) {
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
    var garage_floor = req.body.garage_floor,
        garage_floor2 = req.body.garage_floor2,
        garage_room = req.body.garage_room,
        garage_humid = req.body.garage_humid,
        storage_floor = req.body.storage_floor,
        storage_room = req.body.storage_room,
        storage_humid = req.body.storage_humid,
        timestamp = new Date().getTime(),
        sqlRequest = "INSERT INTO 'GARAGE_TEMP' (timestamp, garage_floor, garage_floor2, garage_room, garage_humid, storage_floor, storage_room, storage_humid) " +
                 "VALUES('" + timestamp + "', '" + garage_floor + "','" + garage_floor2 + "','" + garage_room + "','" + garage_humid + "','"  + storage_floor +  "','" + storage_room + "','" + storage_humid + "')"

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
