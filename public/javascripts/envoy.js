'use strict';
var envoyData = function () {

    $.getJSON('/envoy/', function (Data) {
        try {
                
                var inverters = Data[1].inverters;
                var d = moment(new Date(Data[0].readingTime * 1000));

                $("#readingTime").html('<i class="fa fa-clock-o" aria-hidden="true"></i> ' + d.locale(config.locale).format('LT'));

                $("#wNow").html('<i class="fa fa-bolt" aria-hidden="true"></i> ' + Data[0].wNow /1000 + ' kW');
                $("#wattHoursToday").html('<i class="fa fa-plug" aria-hidden="true"></i> ' + Data[0].wattHoursToday / 1000 + ' kWh');
                $("#wattHoursSevenDays").html('<i class="fa fa-plug" aria-hidden="true"></i> ' + (Data[0].wattHoursSevenDays / 1000).toFixed(1) + ' kWh'); //1 decimal
                $("#whLifetime").html('<i class="fa fa-calendar" aria-hidden="true"></i> ' + Math.round(Data[0].whLifetime / 1000) + ' kWh'); //1 decimal

                var table = document.createElement("table");
                const columnCount = inverters.length;
                var row = table.insertRow(0);
                //var row2 = table.insertRow(0);
                var row3 = table.insertRow(0);
                //to get the inverters on correct order as layout on the roof

                var L1 = [];
                var L2 = [];
                var L3 = [];
                var L3sum = 0;
                var L2sum = 0;
                var L1sum = 0;
                // Separeta the power lines from single array
                for (var i = 0; i < columnCount; i++) {
                    const serialNumber = inverters[i].serialNumber.toString();
                     if (config.envoy.inverters.L1.indexOf(serialNumber) != -1) {
                        L1.push(inverters[i]);
                        L1sum += parseInt(inverters[i].lastReportWatts);
                     } else if (config.envoy.inverters.L2.indexOf(serialNumber) != -1) {
                        L2.push(inverters[i]);
                        L2sum += parseInt(inverters[i].lastReportWatts);
                     } else if (config.envoy.inverters.L3.indexOf(serialNumber) != -1) {
                        L3.push(inverters[i]);
                        L3sum += parseInt(inverters[i].lastReportWatts);
                     }
                }
                // sort the inverters to correct order, which they are on the roof
                const L1Sorted = sortArray(config.envoy.inverters.L1, L1);
                const L2Sorted = sortArray(config.envoy.inverters.L2, L2);
                const L3Sorted = sortArray(config.envoy.inverters.L3, L3);

                addRow(row, L2Sorted, 'L2');
                addRow(row, L1Sorted, 'L1');
                addRow(row3, L3Sorted, 'L3');

                //add sums for phases
                row.insertCell(-1);
                var celltemp = row.insertCell(-1);
                celltemp.innerHTML = " ";
                var cell = row.insertCell(-1);
                cell.title = `Phase: L1  Watts: ${L1sum} \nPhase: L2  Watts: ${L2sum}`;
                cell.innerHTML = L1sum +'|' + L2sum  + ' W';

                celltemp = row3.insertCell(-1);
                celltemp.innerHTML = " ";
                var cell = row3.insertCell(-1);
                cell.title = `Phase: L3  Watts: ${L3sum}`;
                cell.innerHTML = L3sum + ' W';

                var dvTable = document.getElementById("inverters");
                dvTable.innerHTML = "";
                dvTable.appendChild(table);

                document.getElementById("wNow").style.color = "#ffffff";
                document.getElementById("inverters").style.color = "#ffffff";
                document.getElementById("readingTime").style.color = "#ffffff";
                checkIfDataIsStale(Data[0].timestamp);

        } catch (e) {
            if (e instanceof NoNewDataException) {
                document.getElementById("wNow").style.color = "#ff0000";
                document.getElementById("inverters").style.color = "#ff0000";
                document.getElementById("readingTime").style.color = "#ff0000";
            } else {
                $("#wNow").html("-");
            }
        }
    });
}


var envoyDataYesterday = function () {

    $.getJSON('/envoy/yesterday', function (Data) {
        try {

            const lastValue = Data.length -1;
            $("#wattHoursYesterday").html(electricitytext.yesterday + (Data[lastValue].wattHoursToday / 1000).toFixed(2) + ' kWh');

        } catch (e) {

            if (e) {
                $("#wattHoursYesterday").html("-");
            }
        }
    });
};


var envoyDataToday = function () {

    var startOfToday = new Date();
    startOfToday.setHours(4,0,0,0);
    var endOfToday = new Date();
    endOfToday.setHours(23,59,59,999);


    $.getJSON('/envoy/today', function (Data) {
        try {

            var time = [];
            var powervalues = [];
            var today = [];
            const columnCount = Data.length;
            
            for (var i = 0; i < columnCount; i++) {
             
                var temp = (new Date(Data[i].readingTime*1000)).getTime()
                time.push(temp);
                powervalues.push(Data[i].wNow);
                today.push([Data[i].readingTime*1000, Data[i].wNow]);
            }
            $("#envoyChart").html('<div id="container" style="min-width: 500px; height: 150px; margin: 0 auto"></div>');

    Highcharts.setOptions({
        global: {
            useUTC: true,
            timezoneOffset: -180
        }
    });

          var EnvoyChart = Highcharts.chart('container', {
    chart: {
        type: 'area'
    },
        credits: {
        enabled: false
    },
        global: {
        useUTC: true,
        timezoneOffset: 3
    },
      legend: {
            enabled: false
    },
    title: {
        text: ''
    },
    subtitle: {
        text: ''
    },
    xAxis: {
        allowDecimals: false,
        type: 'datetime',
        tickPixelInterval: 60,
        min: startOfToday.getTime(),
        max: endOfToday.getTime()
    },
    yAxis: {
        title: {
            text: ''
        },
        min:0,
        softMax:1900,
        maxPadding: 0,
        offset: -10,
    },
    tooltip: {
        pointFormat: '{series.name} production <b>{point.y:,.0f} watt</b><br/>'
    },
    plotOptions: {
        area: {
            marker: {
                enabled: false,
                symbol: 'circle',
                radius: 2,
                states: {
                    hover: {
                        enabled: true
                    }
                }
            }
        }
    },
    series: [{
        name: 'Power',
        data: today,
        color: '#FFFFFF'
    }]
});

        } catch (e) {

            if (e) {
                $("#wattHoursYesterday").html("-");
            }
        }
    });
};


$(document).ready(function () {

    var d = document.getElementById("wattHoursSevenDays");
        d.onclick = function () {
        window.open(config.envoy.publicUrl);
    };

     var d = document.getElementById("whLifetime");
        d.onclick = function () {
        window.open('http://envoy.local');
    };

    if (config.envoy.show) {
        envoyData();
        //every 60secs
        setInterval(envoyData, 60000);
    
        envoyDataYesterday();
        setInterval(envoyDataYesterday, 21600000);

        //60 secs
        envoyDataToday();
        setInterval(envoyDataToday, 60000);
    }
});

//inverters report data to enphase envoy/web portal in 5/15min interwals, this indicates if data is not sent
function isReportDateOverdue(lastTimestamp) {

    var lastEntryDate = moment(lastTimestamp),
        currentDate = moment(new Date()),
        diff = currentDate.diff(lastEntryDate, 'minutes');
    if (diff >= 16) {
        console.log("not reported Enphase Envoy inverter data since: " + lastEntryDate.format("YYYY-MM-DD HH:mm"));
        return true;
    }
    return false;
}
function sortArray(ref, data) {

    var sortedArray= [];

    for (var i = 0; i < ref.length; i++) {

        var item = ref[i];
        var obj = data.find(function (obj) { return obj.serialNumber.toString() === item.toString(); });
        sortedArray.push(obj);
    }
    return sortedArray;
}

function addRow(row, items, powerPhase) {

    let cell;
    for (var i = 0; i < items.length; i++) {

        cell = row.insertCell(i);
        var text = '<i class="fa fa-circle" aria-hidden="true" style="color: green"></i> ';
        var redbullet = '<i class="fa fa-circle" aria-hidden="true" style="color: Crimson"></i> ';
        var yellowbullet = '<i class="fa fa-circle" aria-hidden="true" style="color: Gold"></i> ';
        if(items[i].producing === 0) {
            text = redbullet;
        } else if (isReportDateOverdue(items[i].lastReportDate*1000)) {
            text = yellowbullet;
        }
        cell.title = `Phase: ${powerPhase} Serial#: ${items[i].serialNumber}  maxWatts: ${items[i].maxReportWatts}`;
        cell.innerHTML = text + items[i].lastReportWatts + ' W ';
    }
}