var socket = io();
var alarmStatus;
var doorClosed;
var doorState;

    socket.on('connect', function(data) {
//        console.log('connecting..');
    });

    socket.on('mqtt', function(msg) {

        var message = msg.topic.split('/');
        var area = message[1];
        var state = message[2];
        var timestamp = Math.round((new Date()).getTime() / 1000);

        let battery; //make it better
        let batteryIcon;
        switch (msg.topic) {
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
                    doorClosed = true;
                    $('#garagestatus').removeClass('badge-danger').addClass('badge badge-success');
                    doortextFullyClosed();
    
                } else {
                    $('#garagestatus').removeClass('badge-success').addClass('badge badge-danger');
                    doorclosed = false;
                    setTimeout(doortextstatus, 12000);
                }
                $('#garagetext').html(`${mqtttext.garageDoor}`);
                $('#garageBattery').html(`${batteryIcon}`);
                $('#garagestatus').html(doorStatusText);

            

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
              //console.log('Error:no such MQTT topic handler.');
              break;
        }
        //swithc case per topic
    });


var toggleAlarm = function () {
    alarmStatus ^= true;
    const topic = 'home/alarm';
    // Send socket.io message to mqtt server side which send the actual mqtt message
    socket.emit('mqtt', {'topic'  : topic, 'payload' : alarmStatus})
}

var activateGarageDoor = function () {
    const topic = 'home/garage/activatedoor';
    // Send socket.io message to mqtt server side which send the actual mqtt message
    socket.emit('mqtt_noretain', {'topic'  : topic, 'payload' : 1})
    if (doorState) {
        $('#activeGarageDoorBtn').removeClass('badge-danger').addClass('badge badge-success');
        $('#activeGarageDoorBtn').html('aktivoi tallin ovi');
    } else {
        $('#activeGarageDoorBtn').removeClass('badge-success').addClass('badge badge-danger');
        $('#activeGarageDoorBtn').html('Pysäytä Ovi');
    }
    doorState ^= true;
}

var doortextstatus = function () {
    
    if(!doorClosed) {
        $('#activeGarageDoorBtn').removeClass('badge-danger').addClass('badge badge-success');
        $('#activeGarageDoorBtn').html('aktivoi tallin ovi');
    }
}

var doortextFullyClosed = function () {
    $('#activeGarageDoorBtn').removeClass('badge-danger').addClass('badge badge-success');
    $('#activeGarageDoorBtn').html('Aukaise tallin Ovi');
}

$(document).ready(function () {

    var d = document.getElementById("activeGarageDoorBtn");
    d.onclick = function () {
        activateGarageDoor();
    };

    var d = document.getElementById("alarmStatus");
    d.onclick = function () {
        toggleAlarm();
    };


});