var socket = io();
var alarmStatus = 0;
var latestWaterLeakReport;

    socket.on('connect', function(data) {
        //console.log('connect to websocket..');
       // socket.emit('join', 'Hello World from client');
    });

    socket.on('mqtt', function(msg) {

        //var message = msg.topic.split('/');
        //var area = message[1];
        //var state = message[2];
        //var timestamp = Math.round((new Date()).getTime() / 1000);

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

            case 'home/garage/ventilator/status':

                const { temp, humid, mode, fan } = msg.payload;

                $("#ventilator_temp").html(temp + '&deg;');
                $("#ventillator_humid").html(humid + '&#37;');
                if (mode === "AUTO") {
                    $("#ventilator_mode").html(mode.toLowerCase());
                } else {
                    $("#ventilator_mode").html('');
                }
                if (fan === "ON") {
                    $("#ventilator_fan").html('<i class="fa fa-wrench" aria-hidden="true"></i> ' + fan.toLowerCase()).removeClass('badge-danger').addClass('badge badge-success')
                } else {
                    $("#ventilator_fan").html('<i class="fa fa-wrench" aria-hidden="true"></i> ' + fan.toLowerCase()).removeClass('badge-success').addClass('badge badge-danger');
                }

              break;
            default: 
              console.log(`Error:no such MQTT topic handler in frontend UI. ${JSON.stringify(msg)}`);
              break;
        }
        //swithc case per topic
    });

var insertModal = function () {
    document.getElementById('ventilatorModal').innerHTML += 
    `<div class="modal fade" id="ventilatorBtn" role="dialog">
      <div class="modal-dialog">
      
        <!-- Modal content-->
        <div class="modal-content">
          <div class="modal-header" style="padding:35px 50px;">
            <button type="button" class="close" data-dismiss="modal">&times;</button>
            <h4><span class="glyphicon glyphicon-cog"></span>Garage Ventilation setup</h4>
          </div>
          <div class="modal-body" style="padding:40px 50px;">
            <form id="ventform" name="vent" role="form">
              <div class="form-group">
                <label for="humid_high"><span class="glyphicon glyphicon-play"></span> set humidity start value (Auto mode)</label>
                <input type="text" name="humid_high" class="form-control" id="humid_high" placeholder="65" value="65" color="black">
              </div>
              <div class="form-group">
                <label for="humid_low"><span class="glyphicon glyphicon-stop"></span> set humidity stop value (Auto mode)</label>
                <input type="text" name="humid_low" class="form-control" id="humid_low" placeholder="55" value="55">
              </div>
              <p>Select Mode:</p>

              <div class="form-group">
                   <label class="radio-inline">
                   <input type="radio" name="fan" id="inlineRadio1" value="AUTO" checked> AUTO
                   </label>
                   <label class="radio-inline">
                   <input type="radio" name="fan" id="inlineRadio1" value="ON"> ON
                   </label>
                   <label class="radio-inline">
                   <input type="radio" name="fan" id="inlineRadio1" value="OFF"> OFF
                   </label>
               </div>
              <p><br></br></p>
              <button type="submit" class="btn btn-success btn-block"><span class="glyphicon glyphicon-floppy-disk"></span> Save</button>
            </form>          
          </div>
          <div class="modal-footer">
            <button type="submit" class="btn btn-danger btn-default pull-left" data-dismiss="modal"><span class="glyphicon glyphicon-remove"></span> Cancel</button>
            
          </div>
        </div>
    </div> 
  </div>`;
}

function parseQuery(queryString) {
    let query = {};
    let pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
    for (var i = 0; i < pairs.length; i++) {
        let pair = pairs[i].split('=');
        query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
    }
    return query;
}

function submitForm() {

    const data = $('form#ventform').serialize();
    const obj = parseQuery(data);
    const topic = 'home/garage/ventilator/cmd';
    const payload = {
        'mode': obj.fan,
        'humid_low': parseInt(obj.humid_low),
        'humid_high': parseInt(obj.humid_high)
    };
    //send the values as mqtt message to sonoff relay to control the ventilation fan
    socket.emit('mqtt_noretainqos0', {'topic'  : topic, 'payload' : JSON.stringify(payload)});

    $("#ventilatorBtn").modal('hide');
}

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

    //initialized ventilation config modal
    insertModal();

    $('#ventilator_fan').on('click', function () {
        $("#ventilatorBtn").modal();
      });

    //handle the ventilation config button save
    $("#ventform").submit(function(event){
        submitForm();
        //close the form until sending has been succesfull
        return false;
	});

});