var socket = io();
var alarmStatus = 0;
var latestWaterLeakReport;
var totalPrice = 0;
var monthlyFeePerHour = 0;
var priceNowSell = 0;
var goeCurrentAmps = null;
var goeTargetAmps = null;
var goePhaseStatus = '';

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
              console.log(`spotprice: ${JSON.stringify(msg.payload)}`);
              //{"Rank":12,"DateTime":"2023-10-11T14:00:00+03:00","PriceNoTax":-0.0001,"PriceWithTax":-0.0001,"PriceLimit":0.05,"RankLimit":12,"PriceWithTaxNextHour":0}
              const { Rank, DateTime, PriceWithTax, PriceWithTax15min, PriceWithTaxNextHour, PriceLimit, ComfortPriceLimit, RankLimit, TotalPrice, MonthlyFeePerHour} = msg.payload;
              $("#spotpriceicon").html('<i class="fa-solid fa-plug" aria-hidden="true"></i> Pörssisähkö');
              $("#spotpricenow").html((spotIndexPlainer((PriceWithTax15min*100).toFixed(2))) + ' snt/kwh');
              $("#spotpricenext").html((spotIndexPlainer((PriceWithTaxNextHour*100).toFixed(2))) + ' snt/kwh (+1h)');

              $("#evutitle").html('<i class="fa-solid fa-arrow-trend-up"></i> Pörssisähkö ohjaus (EVU)');
              $("#evuinfo").html( "Tunti Rank:" + Rank + " limit(" + RankLimit+")");
              $("#evuprice").html("Hintakatto:" + Math.floor(PriceLimit*100) + " snt, Comfort " + Math.floor(ComfortPriceLimit*100));

              //store this as global varibale, will be used later when the data populates from mqtt
              totalPrice = TotalPrice;
              monthlyFeePerHour = MonthlyFeePerHour;
              priceNowSell = PriceWithTax;
              break;

            case 'home/sauna/airheatpump':
              //{'ahptime': 1728049983, 'name': 'Pihasauna', 'serial': '2126811457', 'last_seen': '2024-10-04 13:52:55.091000+00:00', 'power': False, 'operation_mode': 'heat', 'daily_energy_consumed': 0.4, 'total_energy_consumed': 3401.6, 'room_temperature': 10.0, 'target_temperature': 10.0, 'target_temperature_min': 10.0, 'target_temperature_max': 31.0, 'fan_speed': 'auto', 'vane_horizontal': '2', 'vane_vertical': 'auto'}
              console.log(`Sauna AHP: ${JSON.stringify(msg.payload)}`);
              const {
                ahptime,
                name,
                serial,
                last_seen,
                power,
                operation_mode,
                daily_energy_consumed,
                total_energy_consumed,
                room_temperature,
                target_temperature,
                target_temperature_min,
                target_temperature_max,
                fan_speed,
                vane_horizontal,
                vane_vertical
            } = msg.payload;

            $("#name").html(`${name} ILP`);
            if (power === true) {
              $("#power").html(`<span class="badge bg-success"><i class="fa-solid fa-power-off"></i> ON</span>   ${room_temperature}&deg;C<span style="color: grey;">/${target_temperature}&deg;</span>`);
              if (operation_mode === 'heat') {
                $("#operation_mode").html(`<i class="fa-solid fa-sun"></i> Lämmittää`);
              } else if (operation_mode === 'dry') {
                $("#operation_mode").html(`<i class="fa-solid fa-droplet"></i> Kuivaus`);
              }else if (operation_mode === 'cool') {
                $("#operation_mode").html(`<i class="fa-solid fa-snowflake"></i> Viilennys`);
              } else if (operation_mode === 'fan_only') {
                $("#operation_mode").html(`<i class="fa-solid fa-fan"></i> Puhallus`);
              } else {
                $("#operation_mode").html(`<i class="fa-solid fa-head-side-virus"></i> heat-cool?`);
              }
    
            } else {
              $("#power").html(`<span class="badge bg-danger"><i class="fa-solid fa-power-off"></i> OFF</span>   ${room_temperature}&deg;C<span style="color: grey;">/${target_temperature}&deg;</span>`);
            }
            $("#daily_energy_consumed").html(`<i class="fa-solid fa-plug"></i> ${daily_energy_consumed} kwh<span style="color: grey;">/${Math.floor(total_energy_consumed)}</span>`);
            // $("#total_energy_consumed").html(`Energia ${total_energy_consumed}kwh`);
             // 1: OPERATION_MODE_HEAT, <i class="fa-solid fa-sun"></i>
            // 2: OPERATION_MODE_DRY, <i class="fa-solid fa-droplet"></i>
            // 3: OPERATION_MODE_COOL, <i class="fa-regular fa-snowflake"></i>
            // 7: OPERATION_MODE_FAN_ONLY, <i class="fa-solid fa-fan"></i>
            // 8: OPERATION_MODE_HEAT_COOL,<i class="fa-solid fa-head-side-virus"></i>
            $("#fan_speed").html(`<i class="fa-solid fa-fan"></i> ${fan_speed}`);
            //$("#room_temperature").html(`Lämpötila ${room_temperature}&deg;/${target_temperature}&degC;</span>`);
            //$("#target_temperature").html(`<span class="badge bg-success">${target_temperature}&deg;</span>`);
            // const date = new Date(last_seen);
            // $("#last_seen").html(`${date}`);
              //if time > 1h, mark as red
            let ahptime_date = new Date(ahptime*1000);
            //console.log(ahptime_date);
            if (!lessThanOneHourAgo(ahptime_date)) {
              $("#ahptime").html(`<span class="badge bg-danger">viimeisin tieto: ${ahptime_date}</span>`);
              console.log("Failed to get price info" +  ahptime_date);
            } else {
              $("#ahptime").html("");
            }


              break;

            case 'home/engineroom/heatpumpmode':
              console.log(`HPmode state: ${JSON.stringify(msg.payload)}`);
              //{"time":1697022061,"state":1}
              const { hptime, hpmode, hpintegral, hpoutdoorTemp , hptargetTemp} = msg.payload;
              if (hpmode == "ECO") {
                $("#hpmode").html(`Lämmitys: <span class="badge bg-success">ECO -1&deg;</span>`);
              } else {
                $("#hpmode").html(`Lämmitys: <span class="badge bg-warning text-dark">COMFORT +2&deg;</span>`);
              }
        
              let hpmsg_date = new Date(hptime*1000);
              if (!lessThanOneHourAgo(hpmsg_date)) {
                $("#evustate").html(`<span class="badge bg-danger">hintatietojen haku epäonnistu: ${hpmsg_date}</span>`);
                console.log("Failed get info heatpumpmode mqtt" +  hpmsg_date);
              } else {
                //$("#evustate").addClass('badge bg-warning')
              }
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

              case 'home/han/sensor.momentary_active_import':
                $("#hanicon").html('<i class="fa-solid fa-plug" aria-hidden="true"></i> Osto');

                $("#sensor.momentary_active_import").html(msg.payload + ' kw<br>' + ((msg.payload*totalPrice)+(monthlyFeePerHour)).toFixed(2) +' €/h<br>');
              break;

              case 'home/han/sensor.momentary_active_import_phase_1':
                $("#sensor.momentary_active_import_phase_1").html("L1: " + msg.payload);
                break;
              case 'home/han/sensor.momentary_active_import_phase_2':
                $("#sensor.momentary_active_import_phase_2").html("L2: " + msg.payload);
                break;              
              case 'home/han/sensor.momentary_active_import_phase_3':
                $("#sensor.momentary_active_import_phase_3").html("L3: " + msg.payload);
                break;
              case 'home/han/sensor.momentary_active_export':
                //console.log(msg);
                $("#hanicone").html('<i class="fa-solid fa-solar-panel" aria-hidden="true"></i> Myynti');
                $("#sensor.momentary_active_export").html(msg.payload + ' kw<br>' + (msg.payload*priceNowSell).toFixed(2) +' €/h<br>');
                break;
              case 'home/han/sensor.momentary_active_export_phase_1':
                 $("#sensor.momentary_active_export_phase_1").html("L1: " + msg.payload + ' kw');
                break;
              case 'home/han/sensor.momentary_active_export_phase_2':
                $("#sensor.momentary_active_export_phase_2").html("L2: " + msg.payload + ' kw');
                break;
              case 'home/han/sensor.momentary_active_export_phase_3':
                $("#sensor.momentary_active_export_phase_3").html("L3: " + msg.payload + ' kw');
                break;
              case 'home/han/sensor.daily_energy_import':
                $("#sensor.daily_energy_import").html("<i class='fa-solid fa-calendar-day' ></i>" + msg.payload + ' kwh');
                break;
              case 'home/han/sensor.daily_energy_export':
                $("#sensor.daily_energy_export").html("<i class='fa-solid fa-calendar-day'></i> " + msg.payload + ' kwh');
                break;

              // go-e Charger phase limiter status from Home Assistant
              // https://github.com/goecharger/go-eCharger-API-v2/blob/main/apikeys-en.md
              case 'home/han/sensor.phase_overload_status':
                if (msg.payload === 'safe') {
                  goePhaseStatus = '<i class="fa-solid fa-circle-check" style="color: green;"></i>';
                } else if (msg.payload === 'normal') {
                  goePhaseStatus = '<i class="fa-solid fa-exclamation-triangle" style="color: orange;"></i>';
                } else if (msg.payload === 'overload') {
                  goePhaseStatus = '<i class="fa-solid fa-circle-xmark" style="color: red;"></i>';
                }
                // Update charging current display with phase status
                if (goeCurrentAmps !== null) {
                  let ampDisplay = goeTargetAmps !== null 
                    ? `${goeCurrentAmps} A <span style="color: grey;">(${goeTargetAmps})</span>` 
                    : `${goeCurrentAmps} A`;
                  $("#goe_charging_current").html(`${ampDisplay} ${goePhaseStatus}`);
                }
                break;

              case 'home/han/input_number.goe_charger_target_amps':
                goeTargetAmps = parseFloat(msg.payload).toFixed(0);
                // Update charging current display to show target in grey
                if (goeCurrentAmps !== null) {
                  let ampDisplay = `${goeCurrentAmps} A <span style="color: grey;">(${goeTargetAmps})</span>`;
                  $("#goe_charging_current").html(`${ampDisplay} ${goePhaseStatus}`);
                }
                break;

              // go-e Charger direct MQTT topics
              case 'go-eCharger/225812/car':
                // carState: null if internal error (Unknown/Error=0, Idle=1, Charging=2, WaitCar=3, Complete=4, Error=5)
                const carState = parseInt(msg.payload);
                let carIcon = '';
                let carText = '';
                let carColor = 'gray';
                
                // Physical connection status (Idle=1 means not connected)
                if (carState === 1) {
                  $("#goe_car_physical_connection").html('<i class="fa-solid fa-car" style="color: yellow;"></i> <i class="fa-solid fa-plug-circle-xmark" style="color: yellow;"></i> Latausjohto irti');
                } else {
                  $("#goe_car_physical_connection").html('<i class="fa-solid fa-car" style="color: green;"></i> <i class="fa-solid fa-plug-circle-check" style="color: green;"></i> Johto kiinni');
                }
                
                // Charging state
                if (carState === null || carState === 0) {
                  carIcon = '<i class="fa-solid fa-car" style="color: red;"></i>';
                  carText = 'Unknown/Error';
                  carColor = 'red';
                } else if (carState === 1) {
                  carIcon = '<i class="fa-solid fa-car" style="color: orange;"></i>';
                  carText = 'Odottaa';
                  carColor = 'orange';
                } else if (carState === 2) {
                  carIcon = '<i class="fa-solid fa-charging-station" style="color: green;"></i>';
                  carText = 'Lataa';
                  carColor = 'green';
                } else if (carState === 3) {
                  carIcon = '<i class="fa-solid fa-car" style="color: yellow;"></i>';
                  carText = 'Odottaa autoa';
                  carColor = 'yellow';
                } else if (carState === 4) {
                  carIcon = '<i class="fa-solid fa-circle-check" style="color: green;"></i>';
                  carText = 'Valmis';
                  carColor = 'green';
                } else if (carState === 5) {
                  carIcon = '<i class="fa-solid fa-triangle-exclamation" style="color: red;"></i>';
                  carText = 'Virhe';
                  carColor = 'red';
                } else {
                  carIcon = '<i class="fa-solid fa-car" style="color: gray;"></i>';
                  carText = 'Tuntematon';
                  carColor = 'gray';
                }
                
                $("#goe_car_connected").html(`${carIcon} ${carText}`);
                $("#goe_car_state").html('');
                break;

              case 'go-eCharger/225812/amp':
                goeCurrentAmps = parseFloat(msg.payload).toFixed(0);
                let ampDisplay = goeTargetAmps !== null 
                  ? `${goeCurrentAmps} A <span style="color: grey;">(${goeTargetAmps})</span>` 
                  : `${goeCurrentAmps} A`;
                $("#goe_charging_current").html(`${ampDisplay} ${goePhaseStatus}`);
                break;

              case 'go-eCharger/225812/nrg':
                // nrg arrives as already parsed array from server
                try {
                  let nrgArray;
                  // Check if it's already an array or needs parsing
                  if (Array.isArray(msg.payload)) {
                    nrgArray = msg.payload;
                  } else if (typeof msg.payload === 'string') {
                    nrgArray = JSON.parse(msg.payload);
                  } else {
                    console.error('Unexpected nrg payload type:', typeof msg.payload);
                    break;
                  }
                  
                  const totalPower = nrgArray[11]; // P_Total is at index 11
                  const powerKw = (totalPower / 1000).toFixed(2);
                  $("#goe_current_power").html(powerKw + ' kW');
                } catch (e) {
                  console.error('Failed to parse nrg array:', e, 'Payload:', msg.payload);
                }
                break;

              case 'go-eCharger/225812/lmo':
                // Charger mode: 3=Normal, 4=Eco, 5=Daily Trip
                let chargerMode = 'Unknown';
                const lmo = parseInt(msg.payload);
                if (lmo === 3) chargerMode = 'Normal';
                else if (lmo === 4) chargerMode = 'eco';
                else if (lmo === 5) chargerMode = 'Daily Trip';
                $("#goe_charger_mode").html(chargerMode);
                break;

              case 'go-eCharger/225812/wh':
                // Charged amount in Wh, display as kWh
                const chargedKwh = (parseFloat(msg.payload) / 1000).toFixed(2);
                $("#goe_charged_amount").html(chargedKwh + ' kWh');
                break;

              case 'go-eCharger/225812/modelStatus':
                // Model status: Reason why charging or not
                console.log(`go-eCharger modelstatus: ${msg.payload}`);
                const modelStatus = parseInt(msg.payload);
                let statusText = '';
                let statusIcon = '';
                let statusColor = 'gray';
                
                switch(modelStatus) {
                  case 0: statusText = 'Not charging because no charge ctrl data'; statusIcon = '<i class="fa-solid fa-circle-question"></i>'; statusColor = 'gray'; break;
                  case 1: statusText = 'Not charging because overtemperature'; statusIcon = '<i class="fa-solid fa-temperature-high"></i>'; statusColor = 'red'; break;
                  case 2: statusText = 'Not charging because access control wait'; statusIcon = '<i class="fa-solid fa-lock"></i>'; statusColor = 'orange'; break;
                  case 3: statusText = 'Charging because force state on'; statusIcon = '<i class="fa-solid fa-circle-check"></i>'; statusColor = 'green'; break;
                  case 4: statusText = 'Not charging because force state off'; statusIcon = '<i class="fa-solid fa-circle-xmark"></i>'; statusColor = 'red'; break;
                  case 5: statusText = 'Not charging because scheduler'; statusIcon = '<i class="fa-solid fa-clock"></i>'; statusColor = 'orange'; break;
                  case 6: statusText = 'Not charging because energy limit'; statusIcon = '<i class="fa-solid fa-battery-full"></i>'; statusColor = 'orange'; break;
                  case 7: statusText = 'Charging because awattar price low'; statusIcon = '<i class="fa-solid fa-euro-sign"></i>'; statusColor = 'green'; break;
                  case 8: statusText = 'Charging because automatic stop test ladung'; statusIcon = '<i class="fa-solid fa-vial"></i>'; statusColor = 'green'; break;
                  case 9: statusText = 'Charging because automatic stop not enough time'; statusIcon = '<i class="fa-solid fa-hourglass-end"></i>'; statusColor = 'green'; break;
                  case 10: statusText = 'Charging because automatic stop'; statusIcon = '<i class="fa-solid fa-hand"></i>'; statusColor = 'green'; break;
                  case 11: statusText = 'Charging because automatic stop no clock'; statusIcon = '<i class="fa-solid fa-clock-rotate-left"></i>'; statusColor = 'green'; break;
                  case 12: statusText = 'Charging because pv surplus'; statusIcon = '<i class="fa-solid fa-solar-panel"></i>'; statusColor = 'green'; break;
                  case 13: statusText = 'Charging because fallback go e default'; statusIcon = '<i class="fa-solid fa-rotate-left"></i>'; statusColor = 'green'; break;
                  case 14: statusText = 'Charging because fallback go e scheduler'; statusIcon = '<i class="fa-solid fa-calendar-check"></i>'; statusColor = 'green'; break;
                  case 15: statusText = 'Charging because fallback default'; statusIcon = '<i class="fa-solid fa-rotate-left"></i>'; statusColor = 'green'; break;
                  case 16: statusText = 'Not charging because fallback go e awattar'; statusIcon = '<i class="fa-solid fa-euro-sign"></i>'; statusColor = 'orange'; break;
                  case 17: statusText = 'Not charging because fallback awattar'; statusIcon = '<i class="fa-solid fa-euro-sign"></i>'; statusColor = 'orange'; break;
                  case 18: statusText = 'Not charging because fallback automatic stop'; statusIcon = '<i class="fa-solid fa-hand"></i>'; statusColor = 'orange'; break;
                  case 19: statusText = 'Charging because car compatibility keep alive'; statusIcon = '<i class="fa-solid fa-heartbeat"></i>'; statusColor = 'green'; break;
                  case 20: statusText = 'Charging because charge pause not allowed'; statusIcon = '<i class="fa-solid fa-ban"></i>'; statusColor = 'green'; break;
                  case 22: statusText = 'Not charging because simulate unplugging'; statusIcon = '<i class="fa-solid fa-plug"></i>'; statusColor = 'orange'; break;
                  case 23: statusText = 'Not charging because phase switch'; statusIcon = '<i class="fa-solid fa-arrow-right-arrow-left"></i>'; statusColor = 'orange'; break;
                  case 24: statusText = 'Not charging because min pause duration'; statusIcon = '<i class="fa-solid fa-pause"></i>'; statusColor = 'orange'; break;
                  case 26: statusText = 'Not charging because error'; statusIcon = '<i class="fa-solid fa-triangle-exclamation"></i>'; statusColor = 'red'; break;
                  case 27: statusText = 'Not charging because load management doesnt want'; statusIcon = '<i class="fa-solid fa-gauge-high"></i>'; statusColor = 'orange'; break;
                  case 28: statusText = 'Not charging because ocpp doesnt want'; statusIcon = '<i class="fa-solid fa-server"></i>'; statusColor = 'orange'; break;
                  case 29: statusText = 'Not charging because reconnect delay'; statusIcon = '<i class="fa-solid fa-hourglass-half"></i>'; statusColor = 'orange'; break;
                  case 30: statusText = 'Not charging because adapter blocking'; statusIcon = '<i class="fa-solid fa-plug-circle-xmark"></i>'; statusColor = 'orange'; break;
                  case 31: statusText = 'Not charging because underfrequency control'; statusIcon = '<i class="fa-solid fa-wave-square"></i>'; statusColor = 'orange'; break;
                  case 32: statusText = 'Not charging because unbalanced load'; statusIcon = '<i class="fa-solid fa-scale-unbalanced"></i>'; statusColor = 'orange'; break;
                  case 33: statusText = 'Charging because discharging pv battery'; statusIcon = '<i class="fa-solid fa-battery-half"></i>'; statusColor = 'green'; break;
                  case 34: statusText = 'Not charging because grid monitoring'; statusIcon = '<i class="fa-solid fa-tower-cell"></i>'; statusColor = 'orange'; break;
                  case 35: statusText = 'Not charging because ocpp fallback'; statusIcon = '<i class="fa-solid fa-server"></i>'; statusColor = 'orange'; break;
                  default: statusText = `Unknown (${modelStatus})`; statusIcon = '<i class="fa-solid fa-question"></i>'; statusColor = 'gray'; break;
                }
                
                $("#goe_charger_status").html(`<span style="color: ${statusColor};">${statusIcon} ${statusText}</span>`);
                break;

              case 'go-eCharger/225812/alw':
                // Allowed to charge: true or false
                const alw = msg.payload === 'true' || msg.payload === true;
                let alwText = '';
                let alwColor = 'gray';
                let alwIcon = '';
                
                if (alw) {
                  alwText = 'Lataus sallittu';
                  alwColor = 'green';
                  alwIcon = '<i class="fa-solid fa-circle-check"></i>';
                } else {
                  alwText = 'Lataus estetty';
                  alwColor = 'red';
                  alwIcon = '<i class="fa-solid fa-circle-xmark"></i>';
                }
                
                $("#goe_charging_allowed").html(`<span style="color: ${alwColor};"><i class="fa-solid fa-angles-right"></i> ${alwIcon} ${alwText}</span>`);
                break;

              case 'go-eCharger/225812/eto':
                // Total energy in Wh, display as kWh
                const totalKwh = (parseFloat(msg.payload) / 1000).toFixed(2);
                $("#goe_total_energy").html(totalKwh + ' kWh');
                break;

              case 'go-eCharger/225812/cdi':
                // Charging duration info: null=no charging, type=0 counter, type=1 duration in ms
                try {
                  let cdiData;
                  if (typeof msg.payload === 'string') {
                    cdiData = JSON.parse(msg.payload);
                  } else {
                    cdiData = msg.payload;
                  }
                  
                  if (cdiData === null || cdiData.value === null) {
                    $("#goe_charging_duration").html('No charging in progress');
                  } else if (cdiData.type === 1) {
                    // Duration in milliseconds, convert to hours and minutes
                    const durationMs = cdiData.value;
                    const totalSeconds = Math.floor(durationMs / 1000);
                    const hours = Math.floor(totalSeconds / 3600);
                    const minutes = Math.floor((totalSeconds % 3600) / 60);
                    const seconds = totalSeconds % 60;
                    $("#goe_charging_duration").html(`${hours}h ${minutes}m ${seconds}s`);
                  } else if (cdiData.type === 0) {
                    // Counter type
                    $("#goe_charging_duration").html(`Counter: ${cdiData.value}`);
                  }
                } catch (e) {
                  console.error('Failed to parse cdi data:', e, 'Payload:', msg.payload);
                }
                break;

              case 'go-eCharger/225812/utc':

              
                // UTC timestamp, format as readable datetime
                try {
                  const utcTime = msg.payload.replace(/"/g, ''); // Remove quotes if present
                  const date = new Date(utcTime);
                  const formattedTime = date.toLocaleString('fi-FI', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  });
                  $("#goe_last_update").html(formattedTime);
                } catch (e) {
                  console.error('Failed to parse UTC time:', e);
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