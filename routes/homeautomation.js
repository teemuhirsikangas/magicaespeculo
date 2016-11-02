"use strict";
var express = require('express');
var router = express.Router();
var moment = require('moment');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('./data/homeautomation.db');

/* GET homeautomation listing. */
router.get('/', function (req, res, next) {

    db.all('SELECT * FROM temperature ORDER BY id', function (err, row) {
        if (err !== null) {
            res.json(err);
        } else {
            res.json(200, row);
        }
    });
});

/* GET last values homeautomation listing. */
router.get('/temperature', function (req, res, next) {

    db.all('SELECT * FROM temperature ORDER BY id DESC LIMIT 1', function (err, row) {
        if (err !== null) {
            res.json(err);
        } else {
            //console.log(row);
            res.status(200).json(row);
        }
    });
});

/* GET daily temperature values for start of hour */
router.get('/temperature/hourly', function (req, res, next) {

    db.all('SELECT strftime("%Y-%m-%d %H:00:00",timestamp) as date, room, floor, out, humid FROM temperature GROUP BY date ORDER BY date ASC', function (err, row) {
        if (err !== null) {
            res.json(err);
        } else {
            //console.log(row);
            res.status(200).json(row);
        }
    });
});


/* GET last values for id homeautomation listing. */
/*
router.get('/:id', function(req, res, next) {
  
  column = req.params.id;
  sqlRequest  = "SELECT " + column + ", timestamp FROM temperature ORDER BY id DESC LIMIT 1 ";

  db.all(sqlRequest, function(err, row) {
    if(err !== null) {
      // Express handles errors via its next function.
      // It will call the next operation layer (middleware),
      // which is by default one that handles errors.
      next(err);
    }
    else {
      console.log(row);
        res.json(200, row);
    }
  });
});
*/
/*
 * POST to add temperature data
 */
router.post('/temperature', function (req, res) {

    var floor = req.body.floor,
        room = req.body.room,
        out = req.body.out,
        humid = req.body.humid,
        //datetime = req.body.datetime;
        date = moment(new Date()),
        datetime =  date.format("YYYY-MM-DD HH:mm:ss"),
        sqlRequest = "INSERT INTO 'temperature' (floor, room, out, humid, timestamp) " +
                     "VALUES('" + floor + "', '" + room + "','" + out + "','" + humid + "','" + datetime + "')";

    db.run(sqlRequest, function (err) {
        if (err !== null) {
            res.json(err);
        } else {
            res.json(201);
        }
    });
});

/*
 * POST to add ground source heat pump data. avaragevalues per day
 */
router.post('/datastoreday', function (req, res) {

    if (typeof req.body.T_UTE === 'undefined' || req.body.T_UTE === null) {
        res.json(400);
    }

    var time = req.body.TID,
        temp_out = req.body.T_UTE,
        temp_max = req.body.T_UTE_MAX,
        temp_min = req.body.T_UTE_MIN,
        temp_water = req.body.T_VATTEN,
        extraheating = req.body.TS_E,
        time_compressor = req.body.KOMPR_H,
        time_varmwater = req.body.VARMVATTEN_H,
        compressor_starts = req.body.COMPR_STARTS,
        temp_water_max = req.body.T_VATTEN_MAX,
        temp_water_min = req.body.T_VATTEN_MIN,
        sqlRequest = "INSERT INTO 'DATASTORE_DAY' (TID, T_UTE, T_UTE_MAX, T_UTE_MIN, T_VATTEN, TS_E, KOMPR_H, VARMVATTEN_H, COMPR_STARTS, T_VATTEN_MAX, T_VATTEN_MIN) " +
                     "VALUES('" + time + "', '" + temp_out + "','" + temp_max + "','" + temp_min + "','" + temp_water +
                      "','" + extraheating + "','" + time_compressor + "','" + time_varmwater + "','" + compressor_starts + "','" + temp_water_max + "','" + temp_water_min + "' )";

    db.run(sqlRequest, function (err) {
        if (err !== null) {
            //next(err);
            res.json(err);
        } else {
          res.json(201);
        }
    });
  //res.render('index', req.body);
});

 /* GET ground source heat pump data. avaragevalues per day */
router.get('/datastoreday', function (req, res, next) {

    db.all('SELECT * FROM DATASTORE_DAY ORDER BY TID DESC LIMIT 1', function (err, row) {
        if (err !== null) {
            res.json(err);
        } else {
            //console.log(row);
            res.status(200).json(row);
        }
    });
});

/*
 * POST to add ground source heat pump data. raw values, once per 60secs
 */
router.post('/datastoreraw', function (req, res) {

    if (typeof req.body.T_UTE === 'undefined' || req.body.T_UTE === null) {
        res.json(400);
    }
    var time = req.body.TID,
        temp_out = req.body.T_UTE,
        temp_supplyline = req.body.T_FRAM,   //supplyline temp
        temp_supplylinereturn = req.body.T_RETUR, //returnline temp 
        temp_hotwater = req.body.T_VATTEN, //hotwatertemp 
        temp_collector_in = req.body.T_BRINE_IN,
        temp_collector_out = req.body.T_BRINE_UT,
        auxheater_status = req.body.TS_P, //3kw aux heater
        compressor_status = req.body.KOMPR,
        hotwater_status = req.body.VARMVATTEN, //hotwater production
        temp_pressurepipe = req.body.TRYCKR_T,
        circ_pump_speed = req.body.CIRK_SPEED,
        brine_pump_speed = req.body.BRINE_SPEED,
        compressor_start = req.body.COMPR_STARTS,
        hgw_vv = req.body.HGW_VV,
        integral = req.body.INTEGR_DIV,
        sqlRequest = "INSERT INTO 'DATASTORE_RAW' (TID, T_UTE, T_FRAM, T_RETUR, T_VATTEN, T_BRINE_IN, T_BRINE_UT, TS_P, KOMPR, VARMVATTEN, TRYCKR_T, CIRK_SPEED, BRINE_SPEED, COMPR_STARTS, HGW_VV, INTEGR_DIV) " +
               "VALUES('" + time + "', '" + temp_out + "','" + temp_supplyline + "','" + temp_supplylinereturn + "','" + temp_hotwater +
                "','" + temp_collector_in + "','" + temp_collector_out + "','" + auxheater_status + "','" + compressor_status +
                "','" + hotwater_status + "','" + temp_pressurepipe + "','" + circ_pump_speed + "','" + brine_pump_speed +
                "','" + compressor_start  + "','" + hgw_vv + "','" + integral + "')";

    db.run(sqlRequest, function (err) {
        if (err !== null) {
            res.json(err);
        } else {
            res.json(201);
        }
    });
});

 /* GET ground source heat pump data. raw data */
router.get('/datastoreraw', function (req, res, next) {

    db.all('SELECT * FROM DATASTORE_RAW ORDER BY TID DESC LIMIT 1', function (err, row) {
        if (err !== null) {
            res.json(err);
        } else {
            res.status(200).json(row);
        }
    });
});

module.exports = router;
