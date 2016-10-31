'use strict';
var data = function () {

    if (!$("#housetempimage").find('#img_house').length) {
        $("#housetempimage").append("<img id='img_house' src ='/images/house_garage.png'>");
    }

    $.getJSON('/homeautomation/temperature', function (data) {
        try {
            $("#floor").html(data[0].floor + '&deg;');
            $("#room").html(data[0].room + '&deg;');
            $("#out").html(data[0].out + '&deg;');
            $("#humid").html(data[0].humid + '&#37;');
            
            checkIfDataIsStale(data[0].timestamp);

        } catch (e) {

            if (e instanceof noNewDataException) {
                document.getElementById("floor").style.color = "#ff0000";
                document.getElementById("room").style.color = "#ff0000";
                document.getElementById("out").style.color = "#ff0000";
                document.getElementById("humid").style.color = "#ff0000";
            } else {
                $("#floor").html("-");
                $("#room").html("-");
                $("#out").html("-");
                $("#humid").html("-");
            }
        }
    });

    $.getJSON('/garage/temperature', function (garagedata) {
        try {

            $("#garage_floor").html(garagedata[0].garage_floor + '&deg;');
            $("#garage_floor2").html(garagedata[0].garage_floor2 + '&deg;');
            $("#garage_room").html(garagedata[0].garage_room + '&deg;');
            $("#garage_humid").html(garagedata[0].garage_humid + '&#37;');
            $("#storage_floor").html(garagedata[0].storage_floor + '&deg;');
            $("#storage_room").html(garagedata[0].storage_room + '&deg;');
            $("#storage_humid").html(garagedata[0].storage_humid);

            checkIfDataIsStale(garagedata[0].timestamp);

        } catch (e) {

            if (e instanceof noNewDataException) {
                document.getElementById("garage").style.color = "#ff0000";
            } else {
                $("#garage_floor").html("-");
                $("#garage_floor2").html("-");
                $("#garage_room").html("-");
                $("#garage_humid").html("-");
                $("#storage_floor").html("-");
                $("#storage_room").html("-");
                $("#storage_humid").html("-");
            }
        }
    });
};

var temperatureDataChart = function () {

    if (!$("#chartdivbase").find('#chartdiv').length) {
        $("#chartdivbase").append("<div id='chartdiv'></div>");
    } else {
        $("#chartdivbase").find('#chartdiv').remove();
        return;
    }

    $.getJSON('/homeautomation/temperature/hourly', function (temperatureData) {



        try {
            var chartData = populateTempChartData(temperatureData),
                chart = AmCharts.makeChart("chartdiv", {
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
                        "id": "room",
                        "balloonText": "[[value]]",
                        "bullet": "round",
                        "bulletBorderAlpha": 1,
                        "bulletColor": "#FFFAAA",
                        "hideBulletsCount": 50,
                        "title": "room",
                        "valueField": "room",
                        "useLineColorForBulletBorder": true,
                        "balloon": {
                            "drop": true
                        }
                    },
                        {
                            "id": "floor",
                            "balloonText": "[[value]]",
                            "bullet": "round",
                            "bulletBorderAlpha": 1,
                            "bulletColor": "#FFFFFF",
                            "hideBulletsCount": 50,
                            "title": "floor",
                            "valueField": "floor",
                            "useLineColorForBulletBorder": true,
                            "balloon": {
                                "drop": true
                            }
                        },
                                        {
                            "id": "out",
                            "balloonText": "[[value]]",
                            "bullet": "round",
                            "bulletBorderAlpha": 1,
                            "bulletColor": "#FFFFFF",
                            "hideBulletsCount": 50,
                            "title": "out",
                            "valueField": "out",
                            "useLineColorForBulletBorder": true,
                            "balloon": {
                                "drop": true
                            }
                        },
                                        {
                            "id": "humid",
                            "balloonText": "[[value]]",
                            "bullet": "round",
                            "bulletBorderAlpha": 1,
                            "bulletColor": "#FFFFFF",
                            "hideBulletsCount": 50,
                            "title": "humidity",
                            "valueField": "humid",
                            "useLineColorForBulletBorder": true,
                            "balloon": {
                                "drop": true
                            }
                        }],
                    "chartScrollbar": {
                        "autoGridCount": true,
                        "graph": "room",
                        "scrollbarHeight": 40
                    },
                    "chartCursor": {
                        "limitToGraph": "room"
                    },
                    "categoryField": "date",
                    "categoryAxis": {
                        "parseDates": true,
                        "axisColor": "#DADADA",
                        "dashLength": 1,
                        "minorGridEnabled": true,
                        "minPeriod": "hh"
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

function populateTempChartData(data) {
    var chartData = [],
        firstDate = new Date(data[0].date + ":00:00"),
        newDate,
        floor,
        room,
        out,
        humid,
        i;
    for (i = 0; i < data.length; i++) {
        // we create date objects here. In your data, you can have date strings
        // and then set format of your dates using chart.dataDateFormat property,
        // however when possible, use date objects, as this will speed up chart rendering.

        //UTC or local time? check
        newDate = new Date(data[i].date + ":00:00");
        floor = data[i].floor;
        room = data[i].room;
        out = data[i].out;
        humid = data[i].humid;

        chartData.push({
            date: newDate,
            floor: floor,
            room: room,
            out: out,
            humid: humid
        });
    }
    return chartData;
}

$(document).ready(function () {

    var d = document.getElementById("house");
    d.onclick = function () {
        temperatureDataChart();
    };

    var d = document.getElementById("garage");
    d.onclick = function () {
        temperatureDataChart();
    };

    data();
    setInterval(data, 60000);
});