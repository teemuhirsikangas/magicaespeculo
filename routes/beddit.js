"use strict";
var express = require('express');
var router = express.Router();
var moment = require('moment');
var bedditapi = require('beddit-api');
var fs = require('fs');

/* GET beddit data
http://localhost:3333/beddit/
 */
router.get('/:id/:maxResults/:maxDays', function (req, res, next) {
      //asyncGetCalendarData(res, req.params.id, req.params.maxResults, req.params.maxDays);
});

router.get('/', function (req, res) {

    getBedditData(res, 2, 4);

});

var getBedditData = function (res, maxResults, days) {

    var beddit = new Beddit(),
        today = new Date(),
        msecPerDay = 24 * 60 * 60 * 1000,
        maxDays = new Date(today.getTime() - msecPerDay * days),
        start_date = maxDays.toISOString().split('T')[0],
        end_date = today.toISOString().split('T')[0],
        //check paramenters from here: https://github.com/beddit/beddit-api/blob/master/3_2-SleepResources.md
        //var queryparams = { 'updated_after': maxDays.getTime(), 'limit': maxResults  };
        key = require('../data/beddit_key.json'),
        queryparams = { 'start_date': start_date, 'end_date': end_date, 'limit': maxResults, 'reverse' : "no" };
    beddit
        //.login(username, pw)
        .login(key.username, key.password)
        .then(function (auth) {
            beddit
                .sleep(queryparams)
                .then(function (sleep_data) {
                    //console.log(sleep_data);
                    res.json(sleep_data);
                });
        });

};

module.exports = router;
