'use strict';
var daydata = function () {

    $.getJSON('/homeautomation/datastoreday', function (daydata) {

        var d = moment(new Date(daydata[0].TID * 1000));
        $("#d_TID").html(texts.d_TOPIC);
        $("#d_TID_value").html(d.locale(config.locale).format('L'));
        $("#d_T_UTE").html(texts.d_T_UTE);
        $("#d_T_UTE_value").html(daydata[0].T_UTE + '&deg; [' + daydata[0].T_UTE_MAX + '&deg;,' + daydata[0].T_UTE_MIN + '&deg;]');
        $("#d_T_VATTEN").html(texts.d_T_VATTEN);
        $("#d_T_VATTEN_value").html(daydata[0].T_VATTEN + '&deg; [' + daydata[0].T_VATTEN_MAX + '&deg;,' + daydata[0].T_VATTEN_MIN + '&deg;]' );

        var hours = Math.floor(daydata[0].KOMPR_H),
            minutes = daydata[0].KOMPR_H * 60 % 60;
        $("#d_KOMPR_H").html(texts.d_KOMPR_H);
        $("#d_KOMPR_H_value").html(hours + texts.hour + minutes.toFixed(0) + texts.min);
        if(daydata[0].VARMVATTEN_H > 1) {
            hours = Math.floor(daydata[0].VARMVATTEN_H);
            minutes = daydata[0].VARMVATTEN_H * 60 % 60;
            $("#d_VARMVATTEN_H").html(texts.d_VARMVATTEN_H);
            $("#d_VARMVATTEN_H_value").html(hours + texts.hour + minutes.toFixed(0) + texts.min);
        } else {
            $("#d_VARMVATTEN_H").html(texts.d_VARMVATTEN_H);
            $("#d_VARMVATTEN_H_value").html((daydata[0].VARMVATTEN_H * 60).toFixed(0) + texts.min);
        }
        $("#d_COMPR_STARTS").html(texts.d_COMPR_STARTS);
        $("#d_COMPR_STARTS_value").html(daydata[0].COMPR_STARTS);
        $("#d_TSTOP_E").html(texts.d_TSTOP_E);
        $("#d_TSTOP_E_value").html((daydata[0].KOMPR_H * config.groundheatpump.avaragepowerusage + daydata[0].TS_E).toFixed(1) + texts.kWh);
        if (d_TS_E > 0) {
            $("#d_TS_E").html(texts.d_TS_E);
            $("#d_TS_E_value").html(daydata[0].TS_E + texts.kWh);
        }
    });
};

//raw data each minute 
var rawdata = function () {

    $.getJSON('/homeautomation/datastoreraw', function (rawdata) {

        //add groundheatpump image only if it's not added before
        if (!$("#groundheatpump").find('#img_ghp').length) {
            $("#groundheatpump").append("<img id='img_ghp' src ='/images/wp3.png'>");
        }
        var d = moment(new Date(rawdata[0].TID * 1000));
        $("#TID").html(d.locale(config.locale).format('HH:mm'));
        $("#T_UTE").html(rawdata[0].T_UTE + '&deg;');
        $("#T_FRAM").html(rawdata[0].T_FRAM + '&deg;');
        $("#T_RETUR").html(rawdata[0].T_RETUR + '&deg;');
        $("#T_VATTEN").html(rawdata[0].T_VATTEN + '&deg;');
        $("#T_BRINE_IN").html(rawdata[0].T_BRINE_IN + '&deg;');
        $("#T_BRINE_UT").html(rawdata[0].T_BRINE_UT + '&deg;');
        
        if (rawdata[0].TS_P == 1) {
            $("#TS_P").html("<img src ='/images/lightning-clipart-aTqeak7rc.png'>");
        }

        $("#TRYCKR_T").html(rawdata[0].TRYCKR_T + '&deg;');

        if (rawdata[0].VARMVATTEN == 1) {
            $("#VARMVATTEN").html('<div class="container"><div class="red flame"></div><div class="orange flame"></div><div class="yellow flame"></div><div class="white flame"></div><div class="blue circle"></div> <div class="black circle"></div></div>');
        } else {
            $("#VARMVATTEN").html("");
        }

        if (rawdata[0].CIRK_SPEED > 0) {
            $("#gphsupplypumpstatus").html("<i class='fa fa-2x fa-refresh fa-spin'></i>");
        } else {
            $("#gphsupplypumpstatus").html("<i class='fa fa-2x fa-refresh'></i>");
        }

        if (rawdata[0].BRINE_SPEED > 0) {
            $("#gphbrinestatus").html("<i class='fa fa-2x fa-refresh fa-spin'></i>");
        } else {
            $("#gphbrinestatus").html("<i class='fa fa-2x fa-refresh'></i>");
        }

        // TODO
        // and add -webkit-font-smoothing: none; to the @{fa-css-prefix}-spin mixin
        if (rawdata[0].KOMPR == 1) {
            $("#gphcompressorstatus").html("<i class='fa fa-2x fa-cog fa-spin'></i>");
        } else {
            $("#gphcompressorstatus").html("<i class='fa fa-2x fa-cog'></i>");
        }

        $("#INTEGR_DIV").html(rawdata[0].INTEGR_DIV);
        //$("#COMPR_STARTS").html(rawdata[0].COMPR_STARTS); //no need
        //$("#HGW_VV").html(rawdata[0].HGW_VV); //not in this ground heap pump mode,
    });

    $.getJSON('/homeautomation/technicalroom/lastvalues', function (data) {

        try {

        $("#technical_room").html(data[0].technical_room + '&deg;');
        $("#technical_humid").html(data[0].technical_humid + '&#37;');


        checkIfDataIsStale(data[0].timestamp);

        } catch (e) {

            if (e instanceof NoNewDataException) {
                document.getElementById("technical_room").style.color = "#ff0000";
                document.getElementById("technical_humid").style.color = "#ff0000";
            } else {
                //$("#technical_room").html("-");
                //$("#technical_humid").html("-");
            }
        }
    });

};

$(document).ready(function () {

    if(config.groundheatpump.show) {
        
        var d = document.getElementById("groundheatpump");
        d.onclick = function () {
             window.open(config.groundheatpump.domain,'_blank');
        };

        daydata(); 
        //every 10 minutes
        setInterval(daydata, 600000);

        rawdata(); 
        //every 60secs
        setInterval(rawdata, 60000);
    }
});
