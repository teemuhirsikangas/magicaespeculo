/*! simplerWeather v1.0.0
Author: Brooke.
URL: https://github.com/BrookeDot/SimplerWeather
License: MIT
Based on SimpleWeather -- https://github.com/monkeecreate/jquery.simpleWeather

Simple Weather Java Switches to DarkSky */

//made some additions, changes for the weather data //Teemu

( function( $ ) {
  'use strict';

  function getAltTemp( unit, temp ) {
    if( unit === 'f' ) {
      return Math.round( ( 5.0 / 9.0 ) * ( temp - 32.0 ) );
    } else {
      return Math.round( ( 9.0 / 5.0 ) * temp + 32.0 );
    }
  }

  $.extend( {
    simplerWeather: function( options ) {
      options = $.extend( {
        location: '',
        units: 'c',
        authmethod: 'apikey',
        apikey: '',
        proxyurl: '',
        forecast: 'true',
        forecastdays: '4',
        success: function( weather ) {},
        error: function( message ) {}
      }, options );

      let location = '';

      //Sets the units based on https://darksky.net/dev/docs
      if( options.units.toLowerCase() === 'c' ) {
        var units = 'si'
      } else {
        var units = 'us'
      }

      //Check that the latitude and longitude has been set and generate the API URL based on authentication method
      function getWeatherURL( authmethod ) {

        if( authmethod === "apikey" && options.apikey !== '' ) {
          let apiKey = encodeURIComponent( options.apikey );
          return 'https://cors-anywhere.herokuapp.com/https://api.openweathermap.org/data/2.5/weather?q=Lempaala&APPID=' + apiKey + '&units=metric'

        } else if( authmethod === "proxy" && options.proxyurl !== '' ) {
          return encodeURI( options.proxyurl );
        } else {
          options.error(
            'Could not retrieve weather due to an invalid api key or proxy setting.'
          );
        }
      }

      $.getJSON(
        encodeURI( getWeatherURL( options.authmethod ) ),
        function( data ) {
          if( data !== null ) {
            var result = data,
              weather = {};
            //console.log(data);
            weather.temp = result.main.temp;
            weather.currently = result.weather[0].description;
            weather.icon = result.weather[0].main;
            weather.pressure = result.main.pressure;
            weather.humidity = result.main.humidity;
            weather.visibility = result.visibility;
            weather.updated = result.dt;
            weather.windSpeed = result.wind.speed;
            weather.windBearing = result.wind.deg;
            //Where to get uv index?
            weather.uvIndex = 0;
            
            weather.high = result.main.temp_max;
            weather.low = result.main.temp_min;
            weather.sunrise = result.sys.sunrise;
            weather.sunset = result.sys.sunset;
            weather.description = result.weather[0].description;

            weather.attributionlink = "https://darksky.net/";
            weather.unit = options.units.toLowerCase();

            if( weather.unit === 'f' ) {
              weather.altunit = 'c';
            } else {
              weather.altunit = 'f';
            }

            weather.alt = {
              temp: getAltTemp( options.units, weather.temp ),
              high: getAltTemp( options.unit, weather.high ),
              low: getAltTemp( options.unit, weather.low )
            };

            if( options.forecast &&
              parseInt( options.forecastdays ) !== "NaN" ) {

              weather.forecast = [];

              //todo, fix next to openapi from darksky
              // for( var i = 0; i < options.forecastdays; i++ ) {
              //   var forecast = result.daily.data[ i ];
              //   forecast.date = forecast.time;
              //   forecast.summary = forecast.summary;
              //   forecast.high = forecast.temperatureHigh;
              //   forecast.low = forecast.temperatureLow;
              //   forecast.icon = forecast.icon;


              //   forecast.alt = {
              //     high: getAltTemp( options.units, forecast.temperatureHigh ),
              //     low: getAltTemp( options.units, forecast.temperatureLow )
              //   };

              //   weather.forecast.push( forecast );
              // }
            }
            options.success( weather );
          } else {
            options.error(
              'There was a problem retrieving the latest weather information.'
            );
          }
        }
      );
      return this;
    }
  } );
} )( jQuery );
