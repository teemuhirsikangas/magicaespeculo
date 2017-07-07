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

            $("#watts").html('<i class="fa fa-bolt" aria-hidden="true"></i> ' + electricityDataMinute[0].pulsecount * 60 / 1000 + ' kW');
            checkIfDataIsStale(electricityDataMinute[0].timestamp);

        } catch (e) {
            
            if (e instanceof NoNewDataException) {
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


$(document).ready(function () {

    var d = document.getElementById("kwh");
    d.onclick = function () {
        generateChart('/electricity/dailyusage');
    };

    var d = document.getElementById("watts");
    d.onclick = function () {
        generateChart('/electricity/hourly');
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
