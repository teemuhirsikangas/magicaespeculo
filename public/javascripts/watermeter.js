'use strict';
var watermeterData = function () {
    $.getJSON('/watermeter/summary', function (data) {
        // Today's usage with flow rate on same line
        const todayEl = document.getElementById("liters_today");
        const todayValue = data.todayLiters !== null ? data.todayLiters : '-';
        const rateValue = data.currentRateLitersPerMinute !== null ? Math.round(data.currentRateLitersPerMinute) : 0;
        const rateColor = rateValue > 10 ? '#ff0000' : 'white';

        // Determine value color based on status
        let valueColor = '#87CEFA'; // Light blue default
        if (data.status === 'red') {
            valueColor = '#ff0000'; // Red - way over average
            todayEl.classList.remove('warning');
        } else if (data.status === 'yellow') {
            valueColor = '#FFD700'; // Yellow
            todayEl.classList.add('warning');
        } else if (data.todayLiters === null) {
            valueColor = '#ff0000'; // Red for error/no data
            todayEl.classList.remove('warning');
        } else {
            todayEl.classList.remove('warning');
        }

        // Cost display
        const costValue = data.todayCostEur !== null ? data.todayCostEur.toFixed(2) : '-';

        // Icon stays white, liters value colored by status, cost and rate always white (rate red if >10)
        $("#liters_today").html('<i class="fa-solid fa-faucet-drip" aria-hidden="true" style="color:white"></i> <span style="color:' + valueColor + '">' + todayValue + ' L</span> <span style="color:white">(' + costValue + '€)</span> | <span style="color:' + rateColor + '">' + rateValue + ' L/min</span>');
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
        if (levelFill && data.projectedDailyLiters !== null && data.monthlyAvgLiters !== null && data.monthlyAvgLiters > 0) {
            // Calculate fill percentage: 100% = 1.5x average (red zone)
            const ratio = data.projectedDailyLiters / data.monthlyAvgLiters;
            const fillPercent = Math.min(100, (ratio / 1.5) * 100);
            levelFill.style.height = fillPercent + '%';

            // Set color based on ratio
            if (ratio >= 1.5) {
                levelFill.style.backgroundColor = '#ff0000'; // Red
            } else if (ratio >= 1.1) {
                levelFill.style.backgroundColor = '#FFD700'; // Yellow
            } else {
                levelFill.style.backgroundColor = '#87CEFA'; // Blue
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
