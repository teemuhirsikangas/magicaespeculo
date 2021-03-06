'use strict';
var watermeterData = function () {

    $.getJSON('/watermeter/today', function (watermeterData) {
        try {
            $("#liters_today").html('<i class="fa fa-tint fa-lg" aria-hidden="true"></i>  ' + watermeterData[0].liters  + ' l');
            document.getElementById("liters_today").style.color = "#FFFFFF";
            checkIfDataIsStalefrom(watermeterData[0].timestamp, 180);
        } catch (e) {
            if (e instanceof NoNewDataException) {
                document.getElementById("liters_today").style.color = "#ff0000";
            } else {
                $("#liters_today").html("-");
            }
        }
    });

};

var watermeterDataYesterday = function () {

    $.getJSON('/watermeter/yesterday', function (watermeterData) {
        try {

            $("#liters_yesterday").html('('+ watermeterData[0].liters + ')');

        } catch (e) {

            if (e) {
                $("#liters_yesterday").html("-");
            }
        }
    });
};

var watermeterDataMontlyAvarage = function () {

    $.getJSON('/watermeter/thirtydayavarage', function (watermeterData) {
        try {

            $("#liters_thirtydayavarage").html(watermeterData[0].liters + ' x&#x0304l');

        } catch (e) {

            if (e) {
                $("#liters_thirtydayavarage").html("-");
            }
        }
    });
};


$(document).ready(function () {

    var d = document.getElementById("liters_today");
    d.onclick = function () {
        generateChart('/watermeter/minutes');
    };

    var d = document.getElementById("liters_yesterday");
    d.onclick = function () {
        generateChart('/watermeter/hourly');
    };

    var d = document.getElementById("liters_thirtydayavarage");
    d.onclick = function () {
        generateChart('/watermeter/dailyusage');
    };

    if (config.watermeter.show) {
        watermeterData();
        //every 1h to check stale data, as realtime update are triggered by mqtt messages
        setInterval(watermeterData, 3600000);

        watermeterDataYesterday();
        //every 6hours
        setInterval(watermeterDataYesterday, 21600000);
        
        watermeterDataMontlyAvarage();
        //every 6hours
        setInterval(watermeterDataMontlyAvarage, 21600000);

    }
});
