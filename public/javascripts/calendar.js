'use strict';
function ParseGoogleCalendar(calId, calElement) {

    $.getJSON('/calendar/' + calId + '/' + config.calendar.maxResults + '/' + config.calendar.maxDays, function (json) {

        var calitems = [],
            today = new Date(),
            pastEvent = 0;

        if (json === undefined || json === null) {
            return;
        }
        var counter,
            startdate,
            enddate,
            start,
            end,
            startclock,
            endclock,
            startwkday,
            summary,
            caldate,
            i;
        for (i = 0; i < json.items.length; i++) {
            counter = json.items[i];
            startdate = moment(counter.start.dateTime);
            enddate = moment(counter.end.dateTime);
            //start = startdate.locale(config.locale).format('DoM dd');
            start = startdate.locale(config.locale).format(config.calendartextformat);
            //end = enddate.locale(config.locale).format(config.calendartextformat);
            startclock = startdate.locale(config.locale).format(config.calendartimeformat);
            endclock = enddate.locale(config.locale).format(config.calendartimeformat);
            startwkday = startdate.locale(config.locale).format('dd');
            //add calendard icon for awesome-fonts
            summary = "<i class='fa fa-calendar'></i> ";
            caldate = new Date(counter.start.dateTime);
            //check how many past events found 
            if (today.getTime() > caldate.getTime()) {
                pastEvent += 1;
            }
            //add location icon from awesome-fonts
            if (counter.location !== undefined) {
                summary += " " + counter.summary + " <i class='fa fa-map-marker'></i> " + counter.location;
            } else {
                summary += counter.summary;
            }
            calitems.push([start, startclock + " - " + endclock, summary]);
        }

        var table = document.createElement("TABLE");
        //var columnCount = calitems[0].length;
        const columnCount = 3;
        //add header row (used for latest past events from yesterday)
        if (pastEvent > 0) {
            var past,
                row;
            for (past = 0; past < pastEvent; past++) {
                row = table.insertRow(-1);
                for (var i = 0; i < columnCount; i++) {
                    var headerCell = document.createElement("TH");
                    headerCell.innerHTML = calitems[past][i];
                    row.appendChild(headerCell);
                }
            }
        }
        //add data rows
        for (var i = pastEvent; i < calitems.length; i++) {
            row = table.insertRow(-1);
                for (var j = 0; j < columnCount; j++) {
                    var cell = row.insertCell(-1);
                    cell.innerHTML = calitems[i][j];
                }
        }
        var dvTable = document.getElementById(calElement);
        dvTable.innerHTML = "";
        dvTable.appendChild(table);
    });
};

$(document).ready(function() {

    if(config.calendar.show) {
       if(config.calendar.caldendarId != "") {
            ParseGoogleCalendar(config.calendar.caldendarId, "calendar");
            setInterval(function() { ParseGoogleCalendar(config.calendar.caldendarId, "calendar");} , config.calendar.updateinterval);
        }
       if(config.calendar.caldendarId2 != "") {
            ParseGoogleCalendar(config.calendar.caldendarId2, "calendartwo");
            setInterval(function() { ParseGoogleCalendar(config.calendar.caldendarId2, "calendartwo");} , config.calendar.updateinterval);
        }
    }
});
