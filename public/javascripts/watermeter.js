'use strict';
var watermeterData = function () {
    $.getJSON('/watermeter/summary', function (data) {
        // Today's usage with flow rate on same line
        const todayEl = document.getElementById("liters_today");
        const todayValue = data.todayLiters !== null ? data.todayLiters : '-';
        const rateValue = data.currentRateLitersPerMinute !== null ? Math.round(data.currentRateLitersPerMinute) : 0;
        const rateColor = rateValue > 10 ? '#ff0000' : 'white';

        // Determine value color based on status
        let valueColor = '#00FF00'; // Green default
        if (data.status === 'yellow') {
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

        // Icon stays white, only value changes color
        $("#liters_today").html('<i class="fa-solid fa-faucet-drip" aria-hidden="true" style="color:white"></i> <span style="color:' + valueColor + '">' + todayValue + ' L (' + costValue + '€)</span> | <span style="color:' + rateColor + '">' + rateValue + ' L/min</span>');
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

    }).fail(function () {
        $("#liters_today").html('<i class="fa-solid fa-faucet-drip" aria-hidden="true" style="color:white"></i> <span style="color:#ff0000">-</span>');
        $("#liters_current, #liters_yesterday, #liters_weekly_avg, #liters_monthly_avg").html("-");
    });
};


$(document).ready(function () {
    if (config.watermeter.show) {
        watermeterData();
        setInterval(watermeterData, 60000); // Update every minute
    }
});
