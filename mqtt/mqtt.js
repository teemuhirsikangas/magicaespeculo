'use strict';
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/homeautomation.db');
const mqtt = require('mqtt');
const config = require('../config');
var socket_io = require('socket.io');
var io = socket_io();
var socketApi = {};

socketApi.io = io;

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

    socket.mqttClient.on('message', function (topic, message) {
        console.log('Topic ' + topic + ' Message' + message.toString());
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
        socket.mqttClient.publish(data.topic, `${data.payload}`);
    });
});

socketApi.garageDoorNotification = function(message) {
    io.sockets.emit('garagedoor', {msg: `Hello World! ${message}`});
}

// Backend only mqtt client, for DB storing
const init = function () {

    const options = {
        clean: false,
        clientId: config.mqtt.clientId || 'mqtt_nodejs',
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
        switch (topic) {
            case 'home/engineroom/watermeter':
            return handleWaterMeter(message);
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

module.exports =  {
    init,
    socketApi
}
