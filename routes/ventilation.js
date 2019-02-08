"use strict";
const express = require('express');
const router = express.Router();
const moment = require('moment');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/homeautomation.db');

/* GET last values ventilation temp. */
router.get('/', function (req, res, next) {

    db.all('SELECT * FROM VENTILATION ORDER BY timestamp DESC LIMIT 1', function (err, row) {
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
router.post('/', function (req, res) {

    const fresh = req.body.fresh,
        supply_hr = req.body.supply_hr,
        supply = req.body.supply,
        waste = req.body.waste,
        exhaust = req.body.exhaust,
        exhaust_humidity = req.body.exhaust_humidity,
        hr_effiency_in = req.body.hr_effiency_in,
        hr_efficiency_out = req.body.hr_efficiency_out,
        humidity_48h = req.body.humidity_48h,
        control_state = req.body.control_state,
        heating_status = req.body.heating_status,
        timestamp = new Date().getTime(),
        sqlRequest = "INSERT INTO 'VENTILATION' (timestamp, fresh, supply_hr, supply, waste, exhaust, exhaust_humidity, hr_effiency_in, hr_efficiency_out, humidity_48h, control_state, heating_status) " +
                     "VALUES('" + timestamp + "', '" + fresh + "','" + supply_hr + "','" + supply + "','" + waste + "','" + exhaust + "','" + exhaust_humidity + "','" + hr_effiency_in + "','"+ hr_efficiency_out + "','" + humidity_48h + "','" + control_state + "','" + heating_status + "')";
    db.run(sqlRequest, function(err) {
        if (err !== null) {
            res.json(err);
        } else {
            res.json(201);
        }
    });
});


/* GET daily ventilation values for start of hour */
router.get('/hourly', function (req, res, next) {

    db.all('SELECT strftime("%Y-%m-%d %H:00:00",timestamp/1000, "unixepoch", "localtime") as date, fresh, supply, waste, exhaust, exhaust_humidity, hr_effiency_in, hr_efficiency_out FROM VENTILATION GROUP BY date ORDER BY date ASC', function (err, row) {
        if (err !== null) {
            res.json(err);
        } else {
            //console.log(row);
            res.status(200).json(row);
        }
    });
});


module.exports = router;
