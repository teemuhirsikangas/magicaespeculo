var socket = io();
var alarmStatus = 0;
var latestWaterLeakReport;

    socket.on('connect', function(data) {
        console.log('connecting..');
       // socket.emit('join', 'Hello World from client');
    });

    socket.on('mqtt', function(msg) {

        var message = msg.topic.split('/');
        var area = message[1];
        var state = message[2];
        var timestamp = Math.round((new Date()).getTime() / 1000);

        let battery; //make it better
        let batteryIcon;
        switch (msg.topic) {
            case 'home/engineroom/watermeter':
                // get latest values from db to screen
                watermeterData();
              break;

            // 433MHz door sensors
            case 'home/rtl_433/sensor_1813':
            case 'home/rtl_433/sensor_34238':
            case 'home/rtl_433/sensor_50860':
            case 'home/rtl_433/sensor_48187':
            let sensorText = mqtttext.doorOpen;

            if ( !msg.payload.id ) {
                console.log(`unknown sensor ${JSON.stringify(msg)}`);
                break;
            }
            const sensor = msg.payload.id.toString();

            let sensorVal;
            if(sensor === '1813') {
                sensorVal = 'backdoor'
            } else if(sensor === '34238') {
                sensorVal = 'sidedoor'
            } else if(sensor === '50860') {
                sensorVal = 'frontdoor'
            } else if(sensor === '48187') {
                sensorVal = 'garagedoor'
            }
            let batteryIcon = '';
            if (msg.payload.cmd === 14) {
                sensorText = mqtttext.doorClosed;
                $(`#${sensorVal}status`).removeClass('badge-danger').addClass('badge badge-success');
                $(`#${sensorVal}status`).html(sensorText);
            } else if (msg.payload.cmd === 10) {
                $(`#${sensorVal}status`).removeClass('badge-success').addClass('badge badge-danger');
                $(`#${sensorVal}status`).html(sensorText);
            } else {
                //mostlikely cmd 7 === low batter?
                batteryIcon = `<i class="fa fa-battery-empty" aria-hidden="true" style="color:orange"></i>`;
                console.log('unsupported cmd:', msg);
            }
            $(`#${sensorVal}text`).html(`${mqtttext[sensorVal]} ${batteryIcon}`); 

              break;

            case 'home/engineroom/waterleak':

                let waterStatusMsg = mqtttext.statusOK;
                // Store the report time
                latestWaterLeakReport = msg.payload.time;

                if (msg.payload.state === 0) {
                    $('#waterleakStatus').removeClass('badge-danger').removeClass('badge badge-warning').addClass('badge badge-success');
                } else {
                    waterStatusMsg = mqtttext.waterLeakON;
                    $('#waterleakStatus').removeClass('badge-success').removeClass('badge badge-warning').addClass('badge badge-danger');
                }
                $('#waterleakText').html(mqtttext.waterLeak);
                $('#waterleakStatus').html(waterStatusMsg);

                checkWaterLeakLastReportTime();
              break;
            case 'home/alarm':

                let alarmStatusMsg = mqtttext.statusOFF;
                alarmStatus = msg.payload;
                
                if (alarmStatus === 0) {
                    $('#alarmStatus').removeClass('badge-success').addClass('badge badge-danger');
                } else {
                    alarmStatusMsg = mqtttext.statusON;
                    $('#alarmStatus').removeClass('badge-danger').addClass('badge badge-success')
                }
                $('#alarmText').html(mqtttext.alarmtext);
                $('#alarmStatus').html(alarmStatusMsg);

              break;
            default: 
              console.log(`Error:no such MQTT topic handler in frontend UI. ${JSON.stringify(msg)}`);
              break;
        }
        //swithc case per topic
    });

var checkWaterLeakLastReportTime = function () {

    try {
        // check if report time more than 13h
        checkIfDataIsStalefrom(latestWaterLeakReport, 780);
     } catch (error) {
        $('#waterleakStatus').removeClass('badge-success').removeClass('badge-danger').addClass('badge badge-warning');
        $('#waterleakStatus').html(mqtttext.statusNA);
     }
}

var toggleAlarm = function () {
    alarmStatus ^= true;
    const topic = 'home/alarm';
    // Send socket.io message to mqtt server side which send the actual mqtt message
    socket.emit('mqtt', {'topic'  : topic, 'payload' : alarmStatus})
}

$(document).ready(function () {

    var d = document.getElementById("alarmStatus");
    d.onclick = function () {
        toggleAlarm();
    };
    //evrey hour
    checkWaterLeakLastReportTime();
    setInterval(checkWaterLeakLastReportTime, 3600000);

});