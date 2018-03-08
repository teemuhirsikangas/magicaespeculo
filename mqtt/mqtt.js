'use strict';
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/homeautomation.db');
const mqtt = require('mqtt');
const config = require('../config');

module.exports.init = function () {

    const options = {
        clean: false,
        clientId: config.mqtt.clientId || 'mqtt_nodejs',
        username: config.mqtt.username,
        password: config.mqtt.password
    }

    const client  = mqtt.connect(config.mqtt.host, options);

    client.on('connect', (connack) => {
        if (connack.sessionPresent) {
            console.log('Already subscribed, nop');
          } else {
            console.log('First session.');
            client.subscribe('home/#', { qos: 1 })
          }
      })

      client.on('message', (topic, message) => {
        switch (topic) {
          case 'home/engineroom/watermeter':
            return handleWaterMeter(message);
          case 'home/garage/door':
            return handleGarageDoor(message);
          case 'home/lobby/door':
            return handleFrontDoor(message);
          case 'home/engineroom/waterleak':
            return handleEngineRoomWaterLeak(message);

        }
        console.log('No handler for topic %s', topic)
      })

};

function handleEngineRoomWaterLeak(message) {
    console.log(`water leak report consumed ${message}`)    
    const waterMessage = JSON.parse(message);
    const timestamp = new Date().getTime();
    waterMessage.state;
    waterMessage.time;
    //Todo:
    console.log(waterMessage);
    // 1 = LEAK
    // 0 = ok
    // payload = { 'time' : epoch_time, 'state' : state }
}

function handleGarageDoor(message) {
    console.log(`Garage door report consumed ${message}`)    
    const door = JSON.parse(message);
    const timestamp = new Date().getTime();
    //Todo: socket.io
    // vbatt >3 OK 2.9< amber, 2.8 RED
    if (door.door_closed === 1) {
        //door.vbatt;
        console.log(`Garage door closed: ${door}`);
    } else {
        console.log(`Garage door Open: ${door}`);
    }
}

function handleFrontDoor(message) {
    console.log(`Front door report consumed ${message}`)    
    const door = JSON.parse(message);
    const timestamp = new Date().getTime();
    //Todo: socket.io
    // vbatt >3 OK 2.9< amber, 2.8 RED
    if (door.door_closed === 1) {
        //door.vbatt;
        console.log(`Garage door closed: ${door}`);
    } else {
        console.log(`Garage door Open: ${door}`);
    }
}

function handleWaterMeter (message) {

    console.log(`one liter of water consumed ${message}`)    
    const litercount = JSON.parse(message);
    const timestamp = new Date().getTime();

    const sqlRequest = "INSERT INTO 'WATERMETER' (timestamp, litercount) " +
                 "VALUES('" + timestamp + "','" + litercount.water + "')";
    //console.log(sqlRequest);             
    db.run(sqlRequest, function (err) {
        if (err !== null) {
            console.log('Could not store WaterMeter data', err);
        }

    });

  }