"use strict";
var express = require('express');
var router = express.Router();
var moment = require('moment');
var { google } = require('googleapis');
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
var asyncGetCalendarData = async function (res, calId, results, days) {

    try {
    const key = require('../data/key.json');
    const SCOPES =  ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/calendar.readonly' ];
    const jwtClient = new google.auth.JWT(key.client_email, null, key.private_key, SCOPES);
    const calendar = google.calendar('v3');

    await jwtClient.authorize();

    let today = new Date();
    const msecPerDay = 24 * 60 * 60 * 1000;
    const yesterday = new Date(today.getTime() - msecPerDay);
    const maxDays = new Date(today.getTime() + msecPerDay * days);
    today.setHours(0,0,0,0);

    const result = await calendar.events.list({
            auth: jwtClient,
            calendarId: calId,
            maxResults: results,
            timeMax : maxDays.toISOString(),
            timeMin: yesterday.toISOString(), //timeMin: '2016-03-21T13:35:03.850Z',
            singleEvents: true, //needed for orderBy
            orderBy: "startTime",
            fields: "items(end, start, summary, location)"
        });

    res.json(result.data);
    } catch (error) {
        console.log(error);
        res.json([]);
    }
};

module.exports = router;
