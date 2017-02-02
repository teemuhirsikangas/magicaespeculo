'use strict';
var ventilationData = function () {

    //add ventilation image only if it's not added before
    if (!$("#ventilation").find('#img_vent').length) {
        $("#ventilation").append("<img id='img_vent' src ='/images/ventilation2.png'>");
    }

    $.getJSON('/ventilation/', function (ventilationData) {
        try {
            $("#fresh_label").html(ventilationtext.fresh);
            $("#fresh").html(ventilationData[0].fresh + '&deg;');
            //$("#supply_hr").html(ventilationData[0].supply_hr);
            $("#supply_label").html(ventilationtext.supply );
            $("#supply").html(ventilationData[0].supply + '&deg;');
            $("#waste_label").html(ventilationtext.waste);
            $("#waste").html(ventilationData[0].waste + '&deg;');
            $("#exhaust_label").html(ventilationtext.exhaust);
            $("#exhaust").html(ventilationData[0].exhaust + '&deg;');
            $("#exhaust_humidity").html('&nbsp;' + ventilationData[0].exhaust_humidity + '&#37;');
            $("#hr_effiency_in").html("η:" + ventilationData[0].hr_effiency_in);
            $("#hr_efficiency_out").html("η:" + ventilationData[0].hr_efficiency_out);
            $("#humidity_48h").html("(" + ventilationData[0].humidity_48h + ")");
            $("#control_state").html(convertEnerventControStateMessages(ventilationData[0].control_state));    
            $("#heating_status").html(ventilationtext.heating_status[ventilationData[0].heating_status]);
            
            checkIfDataIsStale(ventilationData[0].timestamp);

        } catch (e) {

            if (e instanceof NoNewDataException) {
                //todo, paint all values red with single call
                document.getElementById("fresh").style.color = "#ff0000";
                document.getElementById("supply").style.color = "#ff0000";
                document.getElementById("waste").style.color = "#ff0000";
                document.getElementById("exhaust").style.color = "#ff0000";
                document.getElementById("exhaust_humidity").style.color = "#ff0000";
                document.getElementById("hr_effiency_in").style.color = "#ff0000";
                document.getElementById("hr_efficiency_out").style.color = "#ff0000";
                document.getElementById("humidity_48h").style.color = "#ff0000";
                document.getElementById("control_state").style.color = "#ff0000";
                document.getElementById("heating_status").style.color = "#ff0000";
                document.getElementById("supply_hr").style.color = "#ff0000";
            } else {
                $("#fresh").html("-");
                //$("#supply_hr").html("-");
                $("#supply").html("-");
                $("#waste").html("-");
                $("#exhaust").html("-");
                $("#exhaust_humidity").html("-");
                $("#hr_effiency_in").html("-");
                $("#hr_efficiency_out").html("-");
                $("#humidity_48h").html("-");
                $("#control_state").html("-");
                $("#heating_status").html("-");
            }
        }
    });
};

function convertEnerventControStateMessages(value) {
 
    const orgValue = parseInt(value, 10);
    const maxLenght = orgValue.toString(2).length;
    var message = "",
        binBaseValue = 0,
        position = 0;

    for (var i = maxLenght - 1; i >= 0; i--) { 
        console.log("joo" + i);
        binBaseValue = 1 << position;
        position = position + 1;
        if (orgValue.toString(2).charAt( i ) == 1) {
            message = message + " " + ventilationtext.control_state[binBaseValue] + ",";
        }
    }
    return message.substring(0, message.length - 1);
};

$(document).ready(function () {

    if (config.ventilation.show) {

    var d = document.getElementById("ventilation");
    d.onclick = function () {
        generateChart('/ventilation/hourly');
    };
        ventilationData();
        //every 60secs
        setInterval(ventilationData, 60000);
    }
});
