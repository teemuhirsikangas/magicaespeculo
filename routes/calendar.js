"use strict";
const express = require('express');
const router = express.Router();
const moment = require('moment');
const { google } = require("googleapis");
const key = require('../data/key.json');

const SCOPES = [
'https://www.googleapis.com/auth/calendar',
'https://www.googleapis.com/auth/calendar.readonly'
];


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

        // Create the JWT client
        const jwtClient = new google.auth.JWT({
        email: key.client_email,
        key: key.private_key,
        scopes: SCOPES,
        });

        // Authorize
        await jwtClient.authorize();

        // Use the authorized client
        const calendar = google.calendar({ version: 'v3', auth: jwtClient });
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
