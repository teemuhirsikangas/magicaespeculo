var socket = io();
var alarmStatus = 0;
var latestWaterLeakReport;

    socket.on('connect', function(data) {
       // console.log('connect to websocket..');
       // socket.emit('join', 'Hello World from client');
    });

    socket.on('mqtt', function(msg) {

        // var message = msg.topic.split('/');
        // var area = message[1];
        // var state = message[2];
        // var timestamp = Math.round((new Date()).getTime() / 1000);

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
                $(`#${sensorVal}status`).removeClass('bg-danger').addClass('badge bg-success');
                $(`#${sensorVal}status`).html(sensorText);
            } else if (msg.payload.cmd === 10) {
                $(`#${sensorVal}status`).removeClass('bg-success').addClass('badge bg-danger');
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
                    $('#waterleakStatus').removeClass('bg-danger').removeClass('badge bg-warning').addClass('badge bg-success');
                } else {
                    waterStatusMsg = mqtttext.waterLeakON;
                    $('#waterleakStatus').removeClass('bg-success').removeClass('badge bg-warning').addClass('badge bg-danger');
                }
                $('#waterleakText').html(mqtttext.waterLeak);
                $('#waterleakStatus').html(waterStatusMsg);

                checkWaterLeakLastReportTime();
              break;
            case 'home/alarm':

                let alarmStatusMsg = mqtttext.statusOFF;
                alarmStatus = msg.payload;
                
                if (alarmStatus === 0) {
                    $('#alarmStatus').removeClass('bg-success').addClass('badge bg-danger');
                } else {
                    alarmStatusMsg = mqtttext.statusON;
                    $('#alarmStatus').removeClass('bg-danger').addClass('badge bg-success')
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
                    $("#ventilator_fan").html('<i class="fa fa-wrench" aria-hidden="true"></i> ' + fan.toLowerCase()).removeClass('bg-danger').addClass('badge bg-success');
                } else {
                    $("#ventilator_fan").html('<i class="fa fa-wrench" aria-hidden="true"></i> ' + fan.toLowerCase()).removeClass('bg-success').addClass('badge bg-danger');
                }

              break;
            case 'home/engineroom/spotprice':
              //console.log(`spotprice: ${JSON.stringify(msg.payload)}`);
              //{"Rank":12,"DateTime":"2023-10-11T14:00:00+03:00","PriceNoTax":-0.0001,"PriceWithTax":-0.0001,"PriceLimit":0.05,"RankLimit":12,"PriceWithTaxNextHour":0}
              const { Rank, DateTime, PriceWithTax, PriceWithTaxNextHour, PriceLimit, RankLimit } = msg.payload;

              $("#spotpriceicon").html('<i class="fa-solid fa-plug" aria-hidden="true"></i> Pörssisähkö');
              $("#spotpricenow").html((spotIndexPlainer((PriceWithTax*100).toFixed(2))) + ' snt/kwh');
              $("#spotpricenext").html((spotIndexPlainer((PriceWithTaxNextHour*100).toFixed(2))) + ' snt/kwh (+1h)');

              $("#evutitle").html('<i class="fa-solid fa-arrow-trend-up"></i> Pörssisähkö ohjaus (EVU)');
              $("#evuinfo").html( "Tunti Rank:" + Rank + " limit(" + RankLimit+")");
              $("#evuprice").html("Hintakatto:" + PriceLimit*100 + " snt");

              break;

            case 'home/engineroom/heatpumpevu':
              //console.log(`HPEvu state: ${JSON.stringify(msg.payload)}`);
              //{"time":1697022061,"state":1}
              const { time, state } = msg.payload;
              if (state == 1) {
                $("#evustate").html(`<span class="badge bg-success">Running</span>`);
              } else {
                $("#evustate").html(`<span class="badge bg-danger">EVU stop</span>`);
              }

              //if time > 1h, mark as red
              let msg_date = new Date(time*1000);
              if (!lessThanOneHourAgo(msg_date)) {
                $("#evustate").html(`<span class="badge bg-danger">hintatietojen haku epäonnistu: ${msg_date}</span>`);
                console.log("Failed to get price info" +  msg_date);
              } else {
                //$("#evustate").addClass('badge bg-warning')
              }
              break;

            default: 
              // console.log(`Error:no such MQTT topic handler in frontend UI. ${JSON.stringify(msg)}`);
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
            <button type="button" class="btn btn-danger" data-bs-dismiss="modal">Close</button>

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
        $('#waterleakStatus').removeClass('bg-success').removeClass('bg-danger').addClass('badge bg-warning');
        $('#waterleakStatus').html(mqtttext.statusNA);
     }
}

var toggleAlarm = function () {
    alarmStatus ^= true;
    const topic = 'home/alarm';
    // Send socket.io message to mqtt server side which send the actual mqtt message
    socket.emit('mqtt', {'topic'  : topic, 'payload' : alarmStatus})
}

function spotIndexPlainer(index) {

  indexcomp = Math.floor(index)

  if(indexcomp <= 5) {
    return ` <span class="badge bg-success">${index}</span>`
  } else if(indexcomp >= 5 && indexcomp <= 15) {
      return `<span class="badge bg-warning">${index}</span>`
  } else if(indexcomp > 15) {
    return `<span class="badge bg-danger">${index}</span>`
  }
}

const lessThanOneHourAgo = (date) => {
  const HOUR = 1000 * 60 * 60;
  const anHourAgo = Date.now() - HOUR;

  return date > anHourAgo;
}

$(function () {

    var d = document.getElementById("alarmStatus");
    d.onclick = function () {
        toggleAlarm();
    };
    //every hour
    checkWaterLeakLastReportTime();
    setInterval(checkWaterLeakLastReportTime, 3600000);

    //initialized ventilation config modal
    insertModal();

    $('#ventilator_fan').on('click', function () {
        $("#ventilatorBtn").modal('show');
      });

    //handle the ventilation config button save
    $("#ventform").submit(function(event){
        submitForm();
        //close the form until sending has been successful
        return false;
	});

});