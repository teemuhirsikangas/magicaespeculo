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

            if (e instanceof NoNewDataException) {
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
            $("#storage_humid").html(garagedata[0].storage_humid + '&#37;');

            checkIfDataIsStale(garagedata[0].timestamp);

        } catch (e) {

            if (e instanceof NoNewDataException) {
                document.getElementById("garage_floor").style.color = "#ff0000";
                document.getElementById("garage_floor2").style.color = "#ff0000";
                document.getElementById("garage_room").style.color = "#ff0000";
                document.getElementById("garage_humid").style.color = "#ff0000";
                document.getElementById("storage_floor").style.color = "#ff0000";
                document.getElementById("storage_room").style.color = "#ff0000";
                document.getElementById("storage_humid").style.color = "#ff0000";
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

    $.getJSON('/greenhouse/temperature', function (ghdata) {
        try {
            $("#ghtext").html('Kasvihuone:');
            $("#ghtemp").html(ghdata[0].temp + '&deg;');
            $("#ghhumid").html(ghdata[0].humid + '&#37;');
            const battery = ghdata[0].vbatt;
            
            let batteryIcon = `<i class="fa fa-battery-full" aria-hidden="true" style="color:green"></i>`;

            if (battery < 3.5 && battery > 3.3) {
                batteryIcon = `<i class="fa fa-battery-half" aria-hidden="true" style="color:orange"></i>`;
            } else if (battery <= 3.3) {
                batteryIcon = `<i class="fa fa-battery-empty" aria-hidden="true" style="color:red"></i>`;
            }

            $('#ghvbatt').html(`${batteryIcon} ${battery}V`);
            document.getElementById("ghtemp").style.color = "#ffffff";
            document.getElementById("ghhumid").style.color = "#ffffff";
            document.getElementById("ghvbatt").style.color = "#ffffff";

            checkIfDataIsStalefrom(ghdata[0].timestamp, 15);

        } catch (e) {

            if (e instanceof NoNewDataException) {
                document.getElementById("ghtemp").style.color = "#ff0000";
                document.getElementById("ghhumid").style.color = "#ff0000";
                document.getElementById("ghvbatt").style.color = "#ff0000";
            } else {
                $("#ghtext").html('Kasvihuone:');
                $("#ghtemp").html("-");
                $("#ghhumid").html("-");
                $("#ghvbatt").html("-");
            }
        }
    });
};

$(document).ready(function () {

    var d = document.getElementById("house");
    d.onclick = function () {
        generateChart('/homeautomation/temperature/hourly');
    };

    var d = document.getElementById("garage_floor");
    d.onclick = function () {
        generateChart('/garage/temperature/hourly');
    };

    var d = document.getElementById("greenhouse");
    d.onclick = function () {
        generateChart('/greenhouse/temperature/hourly');
    };

    data();
    setInterval(data, 60000);
});