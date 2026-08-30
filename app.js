'use strict';
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var compression = require('compression');
var sqlite3 = require('sqlite3').verbose();
var db = require('./db_init.js').init();
var mqtt = require('./mqtt/mqtt.js');

var routes = require('./routes/index');
var measurementdata = require('./routes/homeautomation');
var ventilationdata = require('./routes/ventilation');
var calendardata = require('./routes/calendar');
var bedditdata = require('./routes/beddit');
var electricitydata = require('./routes/electricity');
var garagedata = require('./routes/garage');
var greenhousedata = require('./routes/greenhouse');
var envoydata = require('./routes/envoy');
var waterdata = require('./routes/watermeter');
var pug = require('pug');
const config = require('./config');

var app = express();

if (config.mqtt.enabled === true) {
    mqtt.init();
}

app.locals.moment = require('moment');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// gzip responses to cut transfer size on the Pi/LAN
app.use(compression());

// expose only the node_modules actually used by the frontend
// no cache in dev so edited files load without a hard refresh; long cache in production
var staticOptions = { maxAge: app.get('env') === 'development' ? 0 : '7d' };
app.use('/bootstrap', express.static(path.join(__dirname, 'node_modules/bootstrap'), staticOptions));
app.use('/highcharts', express.static(path.join(__dirname, 'node_modules/highcharts'), staticOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public'), staticOptions));

app.use('/', routes);
app.use('/calendar', calendardata);
app.use('/homeautomation', measurementdata);
app.use('/ventilation', ventilationdata);
app.use('/beddit', bedditdata);
app.use('/electricity', electricitydata);
app.use('/garage', garagedata);
app.use('/envoy', envoydata);
app.use('/watermeter', waterdata);
app.use('/greenhouse', greenhousedata);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

console.log("http://localhost:3333");

module.exports = app;
