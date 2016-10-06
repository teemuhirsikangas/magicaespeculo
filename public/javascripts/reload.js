'use strict';
//skycons and awesomefont spin anitmations start to jerk after 4-6hours of running,
//reloading the whole page get care of that
function refresh() {
    window.location.reload(/*true*/);
}

$(document).ready(function () {

    setInterval(refresh, 7200000);
});