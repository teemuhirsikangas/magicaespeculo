'use strict';
var watermeterData = function () {
    $.getJSON('/watermeter/summary', function (data) {
        // Today's usage with flow rate on same line
        const todayEl = document.getElementById("liters_today");
        const todayValue = data.todayLiters !== null ? data.todayLiters : '-';
        const rateValue = data.currentRateLitersPerMinute !== null ? Math.round(data.currentRateLitersPerMinute) : 0;
        const rateColor = rateValue > 10 ? '#ff0000' : 'white';
        $("#liters_today").html('<i class="fa-solid fa-droplet" aria-hidden="true"></i> ' + todayValue + ' L | <span style="color:' + rateColor + '">' + rateValue + ' L/min</span>');

        // Color based on status (green = ok, yellow = trending over average)
        if (data.status === 'yellow') {
            todayEl.style.color = "#FFD700"; // Yellow
            todayEl.classList.add('warning');
        } else if (data.todayLiters === null) {
            todayEl.style.color = "#ff0000"; // Red for error/no data
            todayEl.classList.remove('warning');
        } else {
            todayEl.style.color = "#00FF00"; // Green
            todayEl.classList.remove('warning');
        }

        // Hide the separate flow rate element
        $("#liters_current").hide();

        // Yesterday's usage + weekly average on same line
        const yesterdayValue = data.yesterdayLiters !== null ? data.yesterdayLiters : '-';
        const weeklyAvg = data.weeklyAvgLiters !== null ? data.weeklyAvgLiters : '-';
        $("#liters_yesterday").html('Eilen: ' + yesterdayValue + ' L | Ka: ' + weeklyAvg + ' L/pv');

        // Hide the separate weekly avg element
        $("#liters_weekly_avg").hide();

        // Monthly + Yearly average on same line
        const monthlyAvg = data.monthlyAvgLiters !== null ? data.monthlyAvgLiters : '-';
        const yearlyAvg = data.yearlyAvgLiters !== null ? data.yearlyAvgLiters : '-';
        $("#liters_monthly_avg").html('Kk ka: ' + monthlyAvg + ' L/pv | V ka: ' + yearlyAvg + ' L/pv');

        // Projected daily (optional display)
        if (data.projectedDailyLiters !== null && document.getElementById("liters_projected")) {
            $("#liters_projected").html('Arvio: ' + data.projectedDailyLiters + ' L');
        }

    }).fail(function () {
        $("#liters_today").html('<i class="fa-solid fa-droplet" aria-hidden="true"></i> -');
        $("#liters_current, #liters_yesterday, #liters_weekly_avg, #liters_monthly_avg").html("-");
        document.getElementById("liters_today").style.color = "#ff0000";
    });
};


$(document).ready(function () {
    if (config.watermeter.show) {
        watermeterData();
        setInterval(watermeterData, 60000); // Update every minute
    }
});
