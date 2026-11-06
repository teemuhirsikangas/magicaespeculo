"use strict";
const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/homeautomation.db');

router.get('/today', function (req, res) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    db.all(
        'SELECT timestamp, pv_power FROM SOLIS_PRODUCTION ' +
        'WHERE timestamp >= ? AND timestamp < ? ORDER BY timestamp ASC',
        [start.getTime(), end.getTime()],
        function (err, rows) {
            if (err) {
                console.error('Could not load today\'s Solis production history:', err);
                res.status(500).json({ error: 'Could not load Solis production history' });
                return;
            }
            res.status(200).json(rows);
        }
    );
});

module.exports = router;
