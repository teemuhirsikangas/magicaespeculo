'use strict';
var watermeterData = function () {
    // Daily limit: 460L (3 persons × ~153L/person)
    const DAILY_LIMIT_LITERS = 460;

    $.getJSON('/watermeter/summary', function (data) {
        // Today's usage with flow rate on same line
        const todayEl = document.getElementById("liters_today");
        const todayValue = data.todayLiters !== null ? data.todayLiters : '-';
        const rateValue = data.currentRateLitersPerMinute !== null ? Math.round(data.currentRateLitersPerMinute) : 0;
        const rateColor = rateValue > 10 ? '#ff0000' : 'white';

        // Determine value color based on projected usage vs 460L limit
        let valueColor = '#87CEFA'; // Light blue default
        if (data.todayLiters === null) {
            valueColor = '#ff0000'; // Red for error/no data
            todayEl.classList.remove('warning');
        } else if (data.projectedDailyLiters !== null) {
            if (data.projectedDailyLiters >= DAILY_LIMIT_LITERS) {
                valueColor = '#FFA500'; // Amber - over limit
                todayEl.classList.add('warning');
            } else if (data.projectedDailyLiters >= DAILY_LIMIT_LITERS * 0.8) {
                valueColor = '#FFD700'; // Yellow - approaching limit (80%+)
                todayEl.classList.add('warning');
            } else {
                valueColor = '#87CEFA'; // Blue - under limit
                todayEl.classList.remove('warning');
            }
        } else {
            todayEl.classList.remove('warning');
        }

        // Cost display
        const costValue = data.todayCostEur !== null ? data.todayCostEur.toFixed(2) : '-';

        // Stale data warning (no update in 15+ minutes)
        let staleWarning = '';
        if (data.staleMinutes !== null) {
            const hours = Math.floor(data.staleMinutes / 60);
            const mins = data.staleMinutes % 60;
            const timeStr = hours > 0 ? hours + 'h ' + mins + 'min' : mins + 'min';
            staleWarning = ' <span style="color:#FFA500" title="Ei dataa ' + timeStr + '"><i class="fa-solid fa-triangle-exclamation"></i></span>';
        }

        // Icon stays white, liters value colored by status, cost and rate always white (rate red if >10)
        $("#liters_today").html('<i class="fa-solid fa-faucet-drip" aria-hidden="true" style="color:white"></i> <span style="color:' + valueColor + '">' + todayValue + ' L</span> <span style="color:white">(' + costValue + '€)</span> | <span style="color:' + rateColor + '">' + rateValue + ' L/min</span>' + staleWarning);
        todayEl.style.color = 'white';

        // Hide the separate flow rate element
        $("#liters_current").hide();

        // Yesterday's usage + rolling 7-day average on same line
        const yesterdayValue = data.yesterdayLiters !== null ? data.yesterdayLiters : '-';
        const weeklyAvg = data.weeklyAvgLiters !== null ? data.weeklyAvgLiters : '-';
        $("#liters_yesterday").html('Eilen: ' + yesterdayValue + ' L | 7pv: ' + weeklyAvg + ' L/pv');

        // Hide the separate weekly avg element
        $("#liters_weekly_avg").hide();

        // Rolling 30-day + Yearly average on same line
        const monthlyAvg = data.monthlyAvgLiters !== null ? data.monthlyAvgLiters : '-';
        const yearlyAvg = data.yearlyAvgLiters !== null ? data.yearlyAvgLiters : '-';
        $("#liters_monthly_avg").html('30pv: ' + monthlyAvg + ' L/pv | V ka: ' + yearlyAvg + ' L/pv');

        // Projected daily (optional display)
        if (data.projectedDailyLiters !== null && document.getElementById("liters_projected")) {
            $("#liters_projected").html('Arvio: ' + data.projectedDailyLiters + ' L');
        }

        // Update water level bar
        const levelFill = document.getElementById("water-level-fill");
        if (levelFill && data.projectedDailyLiters !== null) {
            // Calculate fill percentage: 100% = 460L daily limit
            const fillPercent = Math.min(100, (data.projectedDailyLiters / DAILY_LIMIT_LITERS) * 100);
            levelFill.style.height = fillPercent + '%';

            // Set color based on projection vs limit
            if (data.projectedDailyLiters >= DAILY_LIMIT_LITERS) {
                levelFill.style.backgroundColor = '#FFA500'; // Amber - over limit
            } else if (data.projectedDailyLiters >= DAILY_LIMIT_LITERS * 0.8) {
                levelFill.style.backgroundColor = '#FFD700'; // Yellow - approaching limit (80%+)
            } else {
                levelFill.style.backgroundColor = '#87CEFA'; // Blue - under limit
            }
        } else if (levelFill) {
            // No data - show empty bar
            levelFill.style.height = '0%';
        }

    }).fail(function () {
        $("#liters_today").html('<i class="fa-solid fa-faucet-drip" aria-hidden="true" style="color:white"></i> <span style="color:#ff0000">-</span>');
        $("#liters_current, #liters_yesterday, #liters_weekly_avg, #liters_monthly_avg").html("-");
        // Reset level bar on error
        const levelFill = document.getElementById("water-level-fill");
        if (levelFill) {
            levelFill.style.height = '0%';
        }
    });
};


$(document).ready(function () {
    if (config.watermeter.show) {
        // Set device link if configured
        if (config.watermeter.deviceUrl) {
            $('#watermeter-device-link').attr('href', config.watermeter.deviceUrl + '/index.html');
        }
        watermeterData();
        setInterval(watermeterData, 60000); // Update every minute
    }
});
