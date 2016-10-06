'use strict';
var datetime = null,
    date = null;

var time = function () {
    date = moment(new Date());
    document.getElementById("date").innerHTML = date.locale(config.locale).format('dddd, MMMM Do') + " wk:" + date.locale(config.locale).format('w');
    document.getElementById('time').innerHTML = date.locale(config.locale).format('HH:mm');
};

$(document).ready(function () {
    time();
    setInterval(time, 10000);
});
