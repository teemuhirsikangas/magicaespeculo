'use strict';
var date = null;
var time = function () {
    date = moment(new Date());
    document.getElementById("date").innerHTML = date.locale(config.locale).format('dddd, MMMM Do') + " wk:" + date.locale(config.locale).format('w') ;
    document.getElementById('time').innerHTML = date.locale(config.locale).format('HH:mm') + "<span class='secs'>" + date.locale(config.locale).format(':ss');
};

$(document).ready(function () {
    time();
    setInterval(time, 1000);
});
