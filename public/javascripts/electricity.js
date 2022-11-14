'use strict';

var kwh
var price

var kwh_old
var price_old

var kwh_month
var price_month

var electricityData = function () {

    $.getJSON('/electricity/today', function (electricityData) {
        try {
            //show energy used today
            //$("#kwh").html(electricityData[0].pulsecount/1000 + ' kWh');   
            $("#kwh").html('<i class="fa fa-plug" aria-hidden="true"></i> ' + electricityData[0].Wh / 1000 + ' kWh');
            kwh = electricityData[0].Wh / 1000;
            price = kwh * config.electricity.price


        } catch (e) {
            if (e) {
                $("#kwh").html("-");
            }
        }
    });


    $.getJSON('/electricity/now', function (electricityDataMinute) {
        try {

            $("#watts").html('<i class="fa fa-bolt" aria-hidden="true"></i> ' + electricityDataMinute[0].pulsecount * 60 / 1000 + ' kW');
            document.getElementById("watts").style.color = "#ffffff";
            checkIfDataIsStale(electricityDataMinute[0].timestamp);

        } catch (e) {
            
            if (e instanceof NoNewDataException) {
                document.getElementById("watts").style.color = "#ff0000";
            } else {
                $("#kwh").html("-");
            }
        }
    });


};

let toggleValues = function () {

    try {

        let value;
        value = document.getElementById("kwh").innerHTML;

        if (value.includes("kWh")) {
            $("#kwh").html('<i class="fa fa-plug" aria-hidden="true"></i> ' + price.toFixed(2) + ' €');
            $("#kwh_yesterday").html(electricitytext.yesterday + price_old.toFixed(2) + ' €');
            $("#kwh_month").html("kk:" + price_month.toFixed(2) + ' €');
        } else {
            $("#kwh").html('<i class="fa fa-plug" aria-hidden="true"></i> ' + kwh + ' kWh');
            $("#kwh_yesterday").html(electricitytext.yesterday + kwh_old.toFixed(2) + ' kWh');
            $("#kwh_month").html("kk:" + kwh_month.toFixed(1) + ' kWh');
        }

    } catch (e) {
        if (e) {
            $("#kwh").html("-");
        }
    }

}

var electricityDataYesterday = function () {

    $.getJSON('/electricity/yesterday', function (electricityData) {
        try {

            $("#kwh_yesterday").html(electricitytext.yesterday + (electricityData[0].Wh / 1000).toFixed(2) + ' kWh');
            kwh_old = electricityData[0].Wh / 1000;
            price_old = kwh_old * config.electricity.price

        } catch (e) {

            if (e) {
                $("#kwh_yesterday").html("-");
            }
        }
    });
};

var electricityDataCurrentMonth = function () {

    $.getJSON('/electricity/currentmonth', function (electricityData) {
        try {

            $("#kwh_month").html("kk " + (electricityData[0].Wh / 1000).toFixed(2) + ' kWh');
            kwh_month = electricityData[0].Wh / 1000;
            price_month = kwh_month * config.electricity.price
            console.log(kwh_month)
        } catch (e) {

            if (e) {
                $("#kwh_month").html("-");
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

        electricityDataCurrentMonth();
        setInterval(electricityData, 21600000);
        //every 5 secs
        if(config.electricity.togglePrice) {
        setInterval(toggleValues, 5000)
        }

    }
});
