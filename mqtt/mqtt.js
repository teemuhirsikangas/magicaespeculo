'use strict';
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/homeautomation.db');
const mqtt = require('mqtt');
const config = require('../config');

module.exports.init = function () {

    const options = {
        clean: false,
        clientId: 'mqtt_nodejs',
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
            return handleWaterMeter(message)
        }
        console.log('No handler for topic %s', topic)
      })

};

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