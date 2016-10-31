'use strict';
var electricityData = function () {

    $.getJSON('/electricity/today', function (electricityData) {
        try {
            //show energy used today
            //$("#kwh").html(electricityData[0].pulsecount/1000 + ' kWh');   
            $("#kwh").html('<i class="fa fa-plug" aria-hidden="true"></i> ' + electricityData[0].Wh / 1000 + ' kWh');

        } catch (e) {
            if (e) {
                $("#kwh").html("-");
            }
        }
    });


    $.getJSON('/electricity/now', function (electricityDataMinute) {
        try {

            $("#watts").html('<i class="fa fa-tachometer" aria-hidden="true"></i> ' + electricityDataMinute[0].pulsecount * 60 / 1000 + ' kW');
            checkIfDataIsStale(electricityDataMinute[0].timestamp);

        } catch (e) {
            
            if (e instanceof noNewDataException) {
                document.getElementById("kwh").style.color = "#ff0000";
            } else {
                $("#kwh").html("-");
            }
        }
    });


};

var electricityDataYesterday = function () {

    $.getJSON('/electricity/yesterday', function (electricityData) {
        try {

            $("#kwh_yesterday").html(electricitytext.yesterday + electricityData[0].Wh / 1000 + ' kWh');

        } catch (e) {

            if (e) {
                $("#kwh").html("-");
            }
        }
    });
};

var electricityDataChart = function () {

    if (!$("#chartdivbase").find('#chartdiv').length) {
        $("#chartdivbase").append("<div id='chartdiv'></div>");
    } else { //close the chart
        $("#chartdivbase").find('#chartdiv').remove();
        return;
    }

    $.getJSON('/electricity/dailyusage', function (electricityData) {
        try {

            var chartData = populateChartData(electricityData);
            var chart = AmCharts.makeChart("chartdiv", {
                "type": "serial",
                "theme": "light",
                "marginRight": 80,
                "autoMarginOffset": 20,
                "marginTop": 7,
                "dataProvider": chartData,
                "valueAxes": [{
                    "axisAlpha": 0.2,
                    "dashLength": 1,
                    "position": "left"
                }],
                "mouseWheelZoomEnabled": true,
                "graphs": [{
                    "id": "kwh",
                    "balloonText": "[[value]]",
                    "bullet": "round",
                    "bulletBorderAlpha": 1,
                    "bulletColor": "#FFFFFF",
                    "hideBulletsCount": 50,
                    "title": "red line",
                    "valueField": "kwh",
                    "useLineColorForBulletBorder": true,
                    "balloon": {
                        "drop": true
                    }
                }],
                "chartScrollbar": {
                    "autoGridCount": true,
                    "graph": "kwh",
                    "scrollbarHeight": 40
                },
                "chartCursor": {
                    "limitToGraph": "kwh"
                },
                "categoryField": "date",
                "categoryAxis": {
                    "parseDates": true,
                    "axisColor": "#DADADA",
                    "dashLength": 1,
                    "minorGridEnabled": true
                },
                "export": {
                    "enabled": true
                }
            });

            chart.addListener("rendered", zoomChart);
            //zoomChart();

        } catch (e) {
            console.log("error" + e);
        }
    });

};

// this method is called when chart is first inited as we listen for "rendered" event
function zoomChart() {
// different zoom methods can be used - zoomToIndexes, zoomToDates, zoomToCategoryValues
    chart.zoomToIndexes(chartData.length - 40, chartData.length - 1);
}


function populateChartData(data) {
    var chartData = [],
        firstDate = new Date(data[0].date),
        newDate,
        kwh,
        i;
    for (i = 0; i < data.length; i++) {
        // we create date objects here. In your data, you can have date strings
        // and then set format of your dates using chart.dataDateFormat property,
        // however when possible, use date objects, as this will speed up chart rendering.
        newDate = new Date(data[i].date);
        kwh = data[i].wh / 1000;

        chartData.push({
            date: newDate,
            kwh: kwh
        });
    }
    return chartData;
}



$(document).ready(function () {

    var d = document.getElementById("kwh");
    d.onclick = function () {
        electricityDataChart();
    };

    if (config.electricity.show) {
        electricityData();
        //every 60secs
        setInterval(electricityData, 60000);

        electricityDataYesterday();
        //every 6hours
        setInterval(electricityData, 21600000);

    }
});
