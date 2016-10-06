"use strict";
var bedditdata = function () {

    $.getJSON('/beddit/', function (data) {
        try {
            var start = moment(data[0].start_timestamp * 1000).format("YYYY-MM-DD HH:mm"),
                end = moment(data[0].end_timestamp * 1000).format("YYYY-MM-DD HH:mm"),
                //for loopt all dates, and and to bar
                sleepDate = [],
                sleepStart = [],
                sleepStop = [],
                sleepMask = [],
                maxOffset = 0,
                offsetTime,
                stop,
                startOffset,
                StopOffset,
                weekday,
                i;
            for (i = data.length - 1; i >= 0; i--) {
                //console.log(data[i].date);
                offsetTime = moment(data[i].date + ' 00:00');
                start = moment(data[i].start_timestamp * 1000);
                stop = moment(data[i].end_timestamp * 1000);
                startOffset = start.diff(offsetTime, 'minutes');
                StopOffset = stop.diff(offsetTime, 'minutes');
                //stacked bar is drawn from zero, so need to set new offset
                maxOffset = null;
                if (startOffset > 0) {
                    maxOffset = startOffset;
                }
                weekday = new moment(data[i].date).isoWeekday();
                //days[xx] from locales/xx.js
                sleepDate.push(days[weekday]);
                sleepMask.push(maxOffset);
                sleepStart.push(startOffset);
                sleepStop.push(StopOffset);

            }

            //console.log(data[0].end_timestamp);
            /*
              "start_timestamp" : 1371472503.646541,
              "end_timestamp" : 1371492826.623422,
              "date" : "2012-05-30",

              properties:
                "score_sleep_latency" : 5,
                "score_sleep_efficiency" : -20,
                resting_heart_rate
                average_respiration_rate
                sleep_latency //missing if not slept
                away_episode_count //away
                total_snoring_episode_duration //snoring
                stage_duration_S //total sleeptime       
            */
            $("#icon").html('<i class="fa fa-bed fa-3x" aria-hidden="true"></i>');
            $("#chart").html('<canvas id="myChart" height="200" width="150"> </canvas>');
            var ctx = $("#myChart");
            // Chart options
            Chart.defaults.global.legend.display = false;
        //Chart.defaults.global.tooltips.enabled = false;
/*        Chart.defaults.global.scaleLabel = function (label) {
         return label.label.toString()+"jees";
        };
*/
            var myChart = new Chart(ctx, {
                type: 'horizontalBar',
                options: {
                //scaleBeginAtZero: false,
                //scaleLabel: function(label){return  ' $' + label.value/60},
                    scales: {
                        yAxes: [{
                            stacked: true,
                            ticks: {
                                beginAtZero: false,
                                userCallback: function (value, index, values) { return value; }
                            }
                        }],
                        xAxes: [{
                            ticks: {
                                userCallback: function (value, index, values) { return Math.floor(value / 60); },
                                stepWidth: 1
                            }
                        }]
                    }
                },
                data: {
                    labels: sleepDate,
                    datasets: [
                        {
                            //label: "if you go to sleep after three, the bar should only start filling color after correct time, so masking is need
                            label: "mask",
                            backgroundColor: "rgba(0,0,0,256)",
                            //borderColor: "rgba(0,0,0,0)",
                            borderWidth: 0,
                            hoverBackgroundColor: "rgba(255,99,132,0.4)",
                            hoverBorderColor: "rgba(255,99,132,1)",
                            data: sleepMask
                        },
                        {
                            label: "start sleeping",
                            backgroundColor: "rgba(255,255,255,0.2)",
                            //borderColor: "rgba(255,255,255,1)",
                            borderWidth: 1,
                            hoverBackgroundColor: "rgba(255,99,132,0.4)",
                            hoverBorderColor: "rgba(255,99,132,1)",
                            data: sleepStart
                        },
                        {
                            label: "woke up",
                            backgroundColor: "rgba(255,255,255,0.2)",
                            //borderColor: "rgba(255,255,255,1)",
                            borderWidth: 1,
                            hoverBackgroundColor: "rgba(255,99,132,0.4)",
                            hoverBorderColor: "rgba(255,99,132,1)",
                            data: sleepStop
                        }
                    ]
                }

            });
            var totalSleepTime = data[data.length - 1].properties.stage_duration_S / 3600,
                hours = Math.floor(totalSleepTime),
                minutes = Math.round(totalSleepTime * 60 % 60),
                hearRate = data[data.length - 1].properties.resting_heart_rate.toFixed(1),
                minutesparsed = addLeadingZerosToMinb(minutes);
            $("#lastnight").html('<i class="fa fa-clock-o" aria-hidden="true"></i> ' + hours + ":" + minutesparsed + " " + '<br><i class="fa fa-heart" aria-hidden="true"></i> ' + hearRate);

        } catch (e) {
            if (e) {
                $("#floor").html("-");
            }
        }
    });
};

function addLeadingZerosToMinb(time) {

    var temp = time;
    if (parseInt(time, 10) < 10) {
        temp = "0" + time;
    }
    return temp;
}

$(document).ready(function () {
    if (config.beddit.show) {
        bedditdata();
        //every 2hours
        setInterval(bedditdata, 7200000);
    }
});
