"use strict";
const express = require('express');
const router = express.Router();
const moment = require('moment');
const bedditapi = require('beddit-api');
const fs = require('fs');

/* GET beddit data
http://localhost:3333/beddit/
 */
router.get('/:id/:maxResults/:maxDays', function (req, res, next) {
      //asyncGetCalendarData(res, req.params.id, req.params.maxResults, req.params.maxDays);
});

router.get('/', function (req, res) {

    getBedditData(res, 2, 2);

});

const getBedditData = function (res, maxResults, days) {

    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + 1);

    const beddit = new Beddit(),
        today = new Date(),
        msecPerDay = 24 * 60 * 60 * 1000,
        maxDays = new Date(today.getTime() - msecPerDay * days),
        start_date = maxDays.toISOString().split('T')[0],
        end_date = today.toISOString().split('T')[0],
        tomorrow = currentDate.toISOString().split('T')[0],
        //check paramenters from here: https://github.com/beddit/beddit-api/blob/master/3_2-SleepResources.md
        //const queryparams = { 'updated_after': maxDays.getTime(), 'limit': maxResults  };
        key = require('../data/beddit_key.json'),
        queryparams = { 'start_date': start_date, 'end_date': tomorrow, 'limit': maxResults, 'reverse' : "no" };
        console.log(end_date);
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
