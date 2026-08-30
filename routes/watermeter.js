"use strict";
const express = require('express');
const router = express.Router();
const config = require('../config');

// Home Assistant REST API helper
async function fetchHA(endpoint) {
    const response = await fetch(`${config.homeAssistant.url}${endpoint}`, {
        headers: {
            'Authorization': `Bearer ${config.homeAssistant.token}`,
            'Content-Type': 'application/json'
        }
    });
    if (!response.ok) {
        throw new Error(`HA API error: ${response.status}`);
    }
    return response.json();
}

// Get sensor state from Home Assistant
async function getSensorState(entityId) {
    const data = await fetchHA(`/api/states/${entityId}`);
    return parseFloat(data.state) || 0;
}

// Get full sensor data including attributes
async function getSensorData(entityId) {
    return await fetchHA(`/api/states/${entityId}`);
}


// Get history from Home Assistant
async function getHistory(entityId, startTime, endTime) {
    const start = startTime.toISOString();
    const end = endTime ? `&end_time=${endTime.toISOString()}` : '';
    const data = await fetchHA(`/api/history/period/${start}?filter_entity_id=${entityId}${end}&minimal_response`);
    return data[0] || [];
}

// Get the meter value at start of a time range from history
// HA history API returns the state at start_time as first entry, then subsequent changes
async function getMeterValueAtStart(entityId, startTime, endTime) {
    const history = await getHistory(entityId, startTime, endTime);

    if (!history || history.length === 0) return null;

    // First entry in history represents state at or just after startTime
    return parseFloat(history[0].state) || null;
}

// Calculate consumption between two times
async function getConsumption(entityId, startTime, endTime) {
    const history = await getHistory(entityId, startTime, endTime);
    if (!history || history.length < 2) return null;

    const firstValue = parseFloat(history[0].state) || 0;
    const lastValue = parseFloat(history[history.length - 1].state) || 0;

    return Math.max(0, lastValue - firstValue);
}

// Main summary endpoint using Home Assistant
router.get('/summary', async function (req, res) {
    try {
        const now = new Date();

        // Calculate time boundaries
        const todayMidnight = new Date(now);
        todayMidnight.setHours(0, 0, 0, 0);

        const yesterdayMidnight = new Date(todayMidnight);
        yesterdayMidnight.setDate(yesterdayMidnight.getDate() - 1);

        // Rolling period boundaries
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);

        const monthAgo = new Date(now);
        monthAgo.setDate(monthAgo.getDate() - 30);

        // Fetch current meter value and flow rate (with full data for last_updated)
        const [meterData, flowRate] = await Promise.all([
            getSensorData('sensor.watermeter_value').catch(() => null),
            getSensorState('sensor.watermeter_rate_per_time_unit').catch(() => null)
        ]);

        const currentMeterValue = meterData ? parseFloat(meterData.state) || null : null;

        // Check for stale data (no update in 6 hours)
        let staleMinutes = null;
        if (meterData && meterData.last_updated) {
            const lastUpdated = new Date(meterData.last_updated);
            const minutesAgo = Math.floor((now - lastUpdated) / 60000);
            if (minutesAgo >= 360) { // 6 hours
                staleMinutes = minutesAgo;
            }
        }

        // Get meter value at midnight today (for today's consumption)
        // Query from midnight to now - first entry gives us the midnight baseline
        const midnightValue = await getMeterValueAtStart('sensor.watermeter_value', todayMidnight, now).catch(() => null);

        // Calculate today's consumption
        let todayLiters = null;
        if (currentMeterValue !== null && midnightValue !== null) {
            todayLiters = Math.max(0, (currentMeterValue - midnightValue) * 1000);
        }

        // Get yesterday's consumption
        let yesterdayLiters = null;
        try {
            const yesterdayConsumption = await getConsumption('sensor.watermeter_value', yesterdayMidnight, todayMidnight);
            if (yesterdayConsumption !== null) {
                yesterdayLiters = yesterdayConsumption * 1000;
            }
        } catch (e) {
            // Ignore
        }

        // Calculate rolling 7-day average (history API)
        let weeklyAvg = null;
        try {
            const weekConsumption = await getConsumption('sensor.watermeter_value', weekAgo, now);
            if (weekConsumption !== null) {
                weeklyAvg = (weekConsumption * 1000) / 7; // Liters per day
            }
        } catch (e) {
            // Ignore
        }

        // Calculate rolling 30-day average (history API)
        let monthlyAvg = null;
        try {
            const monthConsumption = await getConsumption('sensor.watermeter_value', monthAgo, now);
            if (monthConsumption !== null) {
                monthlyAvg = (monthConsumption * 1000) / 30; // Liters per day
            }
        } catch (e) {
            // Ignore
        }

        // Calculate yearly average using utility meter
        let yearlyAvg = null;
        try {
            const yearlyData = await getSensorData('sensor.water_yearly');
            const yearlyTotal = parseFloat(yearlyData.state) || 0;
            const lastReset = yearlyData.attributes?.last_reset ? new Date(yearlyData.attributes.last_reset) : null;
            
            if (yearlyTotal > 0 && lastReset) {
                // Calculate days since last reset (when utility meter started tracking)
                const daysElapsed = Math.max(1, Math.floor((now - lastReset) / (24 * 60 * 60 * 1000)));
                // Sanity check: if average > 5000 L/day, utility meter probably has bad data
                const avgCandidate = (yearlyTotal * 1000) / daysElapsed;
                if (avgCandidate < 5000) {
                    yearlyAvg = avgCandidate;
                }
            }
        } catch (e) {
            // Ignore
        }

        // Get current month total and day of month for progress tracking
        let monthlyTotalLiters = null;
        let dayOfMonth = now.getDate();
        let daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        try {
            const monthlyData = await getSensorData('sensor.water_monthly');
            const monthlyTotal = parseFloat(monthlyData.state) || 0;
            if (monthlyTotal >= 0) {
                monthlyTotalLiters = monthlyTotal * 1000; // Convert m³ to liters
            }
        } catch (e) {
            // Ignore
        }

        // Calculate projected daily usage based on current pace
        const hoursElapsed = now.getHours() + now.getMinutes() / 60;
        const projectedDaily = (hoursElapsed > 1 && todayLiters !== null) ? (todayLiters / hoursElapsed) * 24 : null;

        // Determine color status
        // Blue = on track or below average, Yellow = trending over average, Red = way over
        let status = 'blue';
        if (projectedDaily !== null && monthlyAvg !== null) {
            if (projectedDaily > monthlyAvg * 1.5) { // 50% over average
                status = 'red';
            } else if (projectedDaily > monthlyAvg * 1.1) { // 10% over average
                status = 'yellow';
            }
        }

        // Flow rate: sensor is in m³/h, convert to L/min
        // m³/h * 1000 = L/h, then / 60 = L/min
        const flowRateLiters = flowRate !== null ? (flowRate * 1000) / 60 : null;

        // Calculate cost: liters * price per liter (price is €/m³ = €/1000L)
        const pricePerLiter = (config.watermeter?.pricePerCubicMeter || 7.45) / 1000;
        const todayCostEur = todayLiters !== null ? todayLiters * pricePerLiter : null;

        res.json({
            todayLiters: todayLiters !== null ? Math.round(todayLiters) : null,
            todayCostEur: todayCostEur !== null ? Math.round(todayCostEur * 100) / 100 : null,
            yesterdayLiters: yesterdayLiters !== null ? Math.round(yesterdayLiters) : null,
            projectedDailyLiters: projectedDaily !== null ? Math.round(projectedDaily) : null,
            weeklyAvgLiters: weeklyAvg !== null ? Math.round(weeklyAvg) : null,
            monthlyAvgLiters: monthlyAvg !== null ? Math.round(monthlyAvg) : null,
            yearlyAvgLiters: yearlyAvg !== null ? Math.round(yearlyAvg) : null,
            monthlyTotalLiters: monthlyTotalLiters !== null ? Math.round(monthlyTotalLiters) : null,
            dayOfMonth: dayOfMonth,
            daysInMonth: daysInMonth,
            currentMeterM3: currentMeterValue,
            currentRateLitersPerMinute: flowRateLiters,
            status: status,
            staleMinutes: staleMinutes,
            updated: now.toISOString()
        });
    } catch (error) {
        console.error('Water meter HA API error:', error.message);
        res.status(500).json({ error: 'Could not fetch water meter data from Home Assistant' });
    }
});

module.exports = router;
