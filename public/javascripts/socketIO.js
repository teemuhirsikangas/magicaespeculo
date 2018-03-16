var socket = io();
var alarmStatus;
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
            case 'home/garage/door':

                battery = msg.payload.vbatt;
                batteryIcon = `<i class="fa fa-battery-full" aria-hidden="true" style="color:green"></i>`;

                if (battery < 3.3 && battery > 3) {
                    batteryIcon = `<i class="fa fa-battery-half" aria-hidden="true" style="color:orange"></i>`;
                } else if (battery <= 3) {
                    batteryIcon = `<i class="fa fa-battery-empty" aria-hidden="true" style="color:red"></i>`;
                }
                let doorStatusText = mqtttext.doorOpen;

                if (msg.payload.door_closed === 1) {
                    doorStatusText = mqtttext.doorClosed;
                    $('#garagestatus').removeClass('badge-danger').addClass('badge badge-success');
                } else {
                    $('#garagestatus').removeClass('badge-success').addClass('badge badge-danger');
                }
                $('#garagetext').html(`${batteryIcon} ${mqtttext.garageDoor}`);
                $('#garagestatus').html(doorStatusText);

              break;
            case 'home/lobby/door':

                battery = msg.payload.vbatt;
                batteryIcon = `<i class="fa fa-battery-full" aria-hidden="true" style="color:green"></i>`;

                if (battery < 3.3 && battery > 3) {
                    batteryIcon = `<i class="fa fa-battery-half" aria-hidden="true" style="color:orange"></i>`;
                } else if (battery <= 3) {
                    batteryIcon = `<i class="fa fa-battery-empty" aria-hidden="true" style="color:red"></i>`;
                }
                let frontText = mqtttext.doorOpen;

                if (msg.payload.door_closed === 1) {
                    frontText = mqtttext.doorClosed;
                    $('#frontdoorstatus').removeClass('badge-danger').addClass('badge badge-success');
                } else {
                    $('#frontdoorstatus').removeClass('badge-success').addClass('badge badge-danger');
                }
                $('#frontdoortext').html(`${batteryIcon} ${mqtttext.frontDoor}`);
                $('#frontdoorstatus').html(frontText);

              break;
            case 'home/engineroom/waterleak':

                let waterStatusMsg = mqtttext.statusOK;
                alarmStatus = msg.payload.time;
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

             break;
            case 'home/alarm':

                let alarmStatusMsg = mqtttext.statusOFF;
                alarmStatus = msg.payload;

                if (alarmStatus === 0) {
                    $('#alarmStatus').removeClass('badge-danger').addClass('badge badge-success');
                } else {
                    alarmStatusMsg = mqtttext.statusON;
                    $('#alarmStatus').removeClass('badge-success').addClass('badge badge-danger');
                }
                $('#alarmText').html(mqtttext.alarmtext);
                $('#alarmStatus').html(alarmStatusMsg);

                checkWaterLeakLastReportTime();   
              break;
            default: 
              console.log('Error:no such MQTT topic handler.');
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