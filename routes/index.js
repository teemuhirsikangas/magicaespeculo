const express = require('express');
const router = express.Router();
const axios = require('axios');
const config = require('../config');

/* GET home page. */
router.get('/', function (req, res, next) {
	
	res.render('index'), { 
	};
});

router.get('/garagedoor', function (req, res, next) {
  	
  	res.render('garagedoor'), { 
    };
});

router.get('/weathermode', function (req, res, next) {
  	
  	res.render('weather'), { 
    };
});

//proxy to get the weather data from dark sky... openweather ask dark sky no more open
router.get('/darksky', async function (req, res, next) {

  try {
		const geoLocation = config.weather.location.split( ',' );
		const lat = geoLocation[ 0 ];
		const lon = geoLocation[ 1 ];
		const units = config.weather.unit;
		const appid = config.weather.apikey
		//const url = 'https://api.darksky.net/forecast/' + config.weather.apikey + '/' + lat + ',' + lon + '/?units=' + units + '&exclude=minutely,hourly,alerts,flags';
		const url = 'https://api.openweathermap.org/data/2.5/weather?q=Lempaala&APPID=' + appid + '&units=metric'
		const response = await axios.get(url);
		res.status(200).json(response.data);

  } catch (error) {
		console.error(error);
		res.json([]);
	}

});

module.exports = router;
