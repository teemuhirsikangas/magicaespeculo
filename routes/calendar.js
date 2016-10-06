"use strict";
var express = require('express');
var router = express.Router();
var moment = require('moment');
var google = require('googleapis');
var fs = require('fs');

/* GET calendar.
http://localhost:3333/calendar/
 */
router.get('/:id/:maxResults/:maxDays', function (req, res, next) {

    asyncGetCalendarData(res, req.params.id, req.params.maxResults, req.params.maxDays);

});

router.get('/:id', function (req, res) {

    asyncGetCalendarData(res, req.params.id, 10, 30);

});

//get calendar events for yesterday to param: days and param: results
var asyncGetCalendarData = function (res, calId, results, days) {

    var key = require('../data/key.json'),
        SCOPES =  ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/calendar.readonly' ],
        jwtClient = new google.auth.JWT(key.client_email, null, key.private_key, SCOPES, null),
        calendar = google.calendar('v3');
    jwtClient.authorize(function (err, tokens) {
        var today = new Date(),
            msecPerDay = 24 * 60 * 60 * 1000,
            yesterday = new Date(today.getTime() - msecPerDay),
            maxDays = new Date(today.getTime() + msecPerDay * days);
        today.setHours(0,0,0,0);

        if (err) {
            console.log(err);
            return;
        } else {
            calendar.events.list({
                auth: jwtClient,
                calendarId: calId,
                maxResults: results,
                timeMax : maxDays.toISOString(),
                timeMin: yesterday.toISOString(), //timeMin: '2016-03-21T13:35:03.850Z',
                singleEvents: true, //needed for orderBy
                orderBy: "startTime",
                fields: "items(end, start, summary, location)"
            }, function (err, CL) {
                if (err) {
                    console.log(err);
                    res.json(err);
                } else {
                    //return data
                    res.json(CL);
                }
            });
        }
    });
};

module.exports = router;
