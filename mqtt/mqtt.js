'use strict';
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/homeautomation.db');
const mqtt = require('mqtt');
const config = require('../config');
const moment = require('moment');
var socket_io = require('socket.io');
const IFTTT = require('node-ifttt-maker');
var io = socket_io();
var socketApi = {};

socketApi.io = io;

//IFTTT stuff, event is the name registered to the service
const ifttt = new IFTTT(config.iftt.key);
const event = 'ovi';
let ALARM = false;

io.on('connection', function(socket){
    console.log('A user connected');

    // Front end mqtt client, just for front end clients
    const options = {
        //clientId: config.mqtt.clientId || 'mqtt_nodejsjoo',
        username: config.mqtt.username,
        password: config.mqtt.password,
        keepalive: 0,
        clean: true
    }
    socket.mqttClient = {};
    socket.mqttClient = mqtt.connect(config.mqtt.host, options);

    // send mqtt messag to frontend
    socket.mqttClient.on('message', function (topic, message) {
        //console.log('Topic ' + topic + ' Message' + message.toString());
        socket.emit('mqtt', {'topic'  : topic, 'payload' : JSON.parse(message)});
      });

    //MQTT connected
    socket.mqttClient.on('connect', function () {
        console.log('mqtt client connected');
        socket.mqttClient.subscribe('home/#')
    });

    //MQTT closed
    socket.mqttClient.on('close', function () {
        console.log('mqtt client closed');
    });

    //  //subscribe new topic
    // socket.on('subscribe', function (data) {
    //     console.log('Subscribing to '+data.topic);
    //     socket.mqttClient.subscribe(data.topic);
    // });

    //socket disconnect     
    socket.on('disconnect', function () {
        console.log('disconnecting:', socket.id);
        socket.mqttClient.end();
        //delete socket;
    });
    //send MQTT mesage from front-end socket.emit
    socket.on('mqtt', function (data) {
        socket.mqttClient.publish(data.topic, `${data.payload}`, {retain: true});
    });

    socket.on('mqtt_noretain', function (data) {
        socket.mqttClient.publish(data.topic, `${data.payload}`, {retain: false, qos: 2});
    });
});

socketApi.garageDoorNotification = function(message) {
    io.sockets.emit('garagedoor', {msg: `Hello World! ${message}`});
}

// Backend only mqtt client, for DB storing
const init = function () {

    const options = {
        clean: false, // set to false to receive QoS 1 and 2 messages while offline
        clientId: 'mqttjs_notifier' + Math.random().toString(16).substr(2, 8),
        username: config.mqtt.username,
        password: config.mqtt.password
    }

    const client  = mqtt.connect(config.mqtt.host, options);

    client.on('connect', (connack) => {
        if (connack.sessionPresent) {
            //console.log('Already subscribed, nop');
        } else {
            //console.log('First session.');
            client.subscribe('home/#', { qos: 1 })
          }
      });

      client.on('message', (topic, message) => {
        //special cases for db storage
        const now = moment(new Date());
        const date = now.locale('fi').format('HH:mm:ss YYYY-MM-DD');

        switch (topic) {
            case 'home/engineroom/watermeter':
                handleWaterMeter(message);
                break;
            case 'home/greenhouse/temp':
                handleGreenHouse(message);
                break;
            case 'home/alarm':

                ALARM = parseInt(message);
                if (ALARM) {
                    sendIFTT('Alarm', 'is set ON ', date);
                } else {
                    sendIFTT('Alarm', 'is set OFF ', date);
                }
                break;
            case 'home/rtl_433/sensor_1813':
            case 'home/rtl_433/sensor_34238':
            case 'home/rtl_433/sensor_50860':
                const msg = JSON.parse(message);
                if (ALARM) {
                    const sensor = msg.id.toString();
                    let sensorVal;
                    if (sensor === '1813') {
                        sensorVal = 'takaovi'
                    } else if(sensor === '34238') {
                        sensorVal = 'sivuovi'
                    } else if(sensor === '50860') {
                        sensorVal = 'etuovi'
                    }
                    let status = 'kiinni';
                    if (msg.cmd.toString() === '10') {
                        status = 'auki';
                    }
                    sendIFTT(sensorVal, status, date);
                }
                break;

            case 'home/engineroom/waterleak':

                const wtrmsg = JSON.parse(message);
                if (wtrmsg.state.toString() === '1') {
                    const msg = 'Päähanan vesivuoto!';
                    sendIFTT(msg, date, '');
                }
                break;

            default: 
                break;
        }
        });
};
function handleWaterMeter (message) {

    console.log(`one liter of water consumed ${message}`)    
    const litercount = JSON.parse(message);
    const timestamp = new Date().getTime();

    const sqlRequest = "INSERT INTO 'WATERMETER' (timestamp, litercount) " +
                 "VALUES('" + timestamp + "','" + litercount.water + "')";

    db.run(sqlRequest, function (err) {
        if (err !== null) {
            console.log('Could not store WaterMeter data', err);
        }

    });

  }

  function handleGreenHouse (message) {

    console.log(`greenhouse data ${message}`)    
    const data = JSON.parse(message);
    console.log(data);
    const timestamp = new Date().getTime();

    const sqlRequest = "INSERT INTO 'GREENHOUSE_TEMP' (timestamp, temp, humid, vbatt) " +
    "VALUES('" + timestamp + "', '" + data.temperature + "','" + data.humidity + "','" + data.vbatt + "')"

    db.run(sqlRequest, function (err) {
        if (err !== null) {
            console.log('Could not store greenhouse data', err);
        }

    });

  }

const sendIFTT = async (value1, value2, value3) => {

    const params = {
        value1,
        value2,
        value3 
    }
    try {
        const response = await ifttt.request({ event, params });

    } catch (error) {
        console.log(error);
    }
}

module.exports =  {
    init,
    socketApi
}
