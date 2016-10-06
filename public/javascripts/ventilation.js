'use strict';
var ventilationData = function () {

    //add ventilation image only if it's not added before
    if (!$("#ventilation").find('#img_vent').length) {
        $("#ventilation").append("<img id='img_vent' src ='/images/ventilation2.png'>");
    }

    $.getJSON('/ventilation/temperature', function (ventilationData) {
        try {
            $("#outdoor_label").html(ventilationtext.outside);
            $("#outdoor").html(ventilationData[0].outdoor + '&deg;');
            $("#supply_label").html(ventilationtext.supply);
            $("#supply").html(ventilationData[0].supply + '&deg;');
            $("#exhaust_label").html(ventilationtext.exhaust);
            $("#exhaust").html(ventilationData[0].exhaust + '&deg;');
            $("#waste_label").html(ventilationtext.waste);
            $("#waste").html(ventilationData[0].waste + '&deg;');

        } catch (e) {
            if (e) {
                $("#outdoor_label").html(ventilationtext.outside);
                $("#outdoor").html('- &deg;');
                $("#supply_label").html(ventilationtext.supply);
                $("#supply").html('- &deg;');
                $("#exhaust_label").html(ventilationtext.exhaust);
                $("#exhaust").html('- &deg;');
                $("#waste_label").html(ventilationtext.waste);
                $("#waste").html('- &deg;');
            }
        }
    });
};

var ventilationMiscData = function () {

    $.getJSON('/ventilation/misc', function (ventilationMiscData) {
        try {
            $("#humidity_label").html(ventilationtext.humid);
            $("#power_label").html(ventilationtext.pwr);
            $("#input_label").html(ventilationtext.input);
            $("#output_label").html(ventilationtext.output);
            humid = ventilationMiscData[0].humidity + '&#37; (' + ventilationMiscData[0].humidity48hmean + ')'
            $("#humidity").html(humid);
            //$("#humidity48hmean_label").html();
            //$("#humidity48hmean").html(ventilationMiscData[0].humidity48hmean + '&#37;');
            $("#input").html(ventilationMiscData[0].input);
            $("#output").html(ventilationMiscData[0].output);
            $("#power").html(ventilationMiscData[0].power);
            //console.log(data);
        } catch (e) {
            if (e) {
                $("#humidity_label").html(ventilationtext.humid);
                $("#power_label").html(ventilationtext.pwr);
                $("#input_label").html(ventilationtext.input);
                $("#output_label").html(ventilationtext.output);
                $("#humidity").html("-");
                //$("#humidity48hmean_label").html();
                //$("#humidity48hmean").html(ventilationMiscData[0].humidity48hmean + '&#37;');
                $("#input").html("-");
                $("#output").html("-");
                $("#power").html("-");
            }
        }
    });
};

$(document).ready(function () {

    if (config.ventilation.show) {
        ventilationData();
        //every 60secs
        setInterval(ventilationData, 60000);
        //every 60 secs
        ventilationMiscData();
        setInterval(ventilationMiscData, 60000);
    }
});
