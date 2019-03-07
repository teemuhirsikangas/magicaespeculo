'use strict';
var weather = function () {
        $.simplerWeather({
            authmethod: 'proxy',
            //use own proxy in index.js to get rid of corrs
            proxyurl: '/darksky',
            success: function (weather) {
                let skycons = new Skycons({"color": "white"}),
                    skycons_forecast = new Skycons({"color": "white"}),
                    current_weather = '<canvas id="weather-icon" width="128" height="128"></canvas>',
                    temp_sunrise = new Date(weather.sunrise * 1000),                    
                    temp_sunset = new Date(weather.sunset * 1000);
                let sunrise = temp_sunrise.getHours() + ":" + addLeadingZerosToMin(temp_sunrise.getMinutes());
                let sunset = temp_sunset.getHours() + ":" + addLeadingZerosToMin(temp_sunset.getMinutes());

                current_weather += '<div id= weather_desc>' + weather.currently + '</div>';
                current_weather += '<div id= uv_index style="font-size:70%" >UV-index' + uvIndexPlainer(weather.uvIndex) + '</div>';
                current_weather += '<div>' + degToCompass(weather.windBearing) + ' ' + weather.windSpeed + ' ' + 'km/h' + '</div>';
                current_weather += '<div><canvas id=sunrise width="18" height="18"> </canvas>' + sunrise + '<canvas id=sunset width="18" height="18"> </canvas> ' + sunset + '</div>';
                $("#weather_now").html(current_weather);
                let date,
                    weekday,
                    forecast,
                    forecastValue,
                    forecastIcons,
                    i;
                for (i = 0; i < weather.forecast.length; i++) {
                    date = moment(new Date(weather.forecast[i].date*1000));
                    weekday = date.isoWeekday();
                    forecast = days[weekday];
                    forecastValue = weather.forecast[i].high.toFixed(0) + ' ' + weather.forecast[i].low.toFixed(0);
                    forecastIcons = "<canvas id=weather-forecast-" + i + "> </canvas>";
                    $("#weather-forecast-day-" + i).html(forecast);
                    $("#weather-forecast-value-" + i).html(forecastValue);
                    $("#weather-forecast-icon-" + i).html(forecastIcons);
                }

                skycons_forecast.add("sunrise", "clear-day");
                skycons_forecast.add("sunset", "clear-night");

                for (i = 0; i < weather.forecast.length; i++) {
                    skycons_forecast.add("weather-forecast-" + i, weather.forecast[i].icon);
                }

                skycons.remove('weather-icon');
                let animation = weather.icon;
                skycons.add("weather-icon", animation);
                skycons.play();
            },
            error: function (error) {
                $("#weather").html('<p>' + error + '</p>');
            }
        });
    };

$(document).ready(function () {
    weather();
    setInterval(weather, 600000);
});

function uvIndexPlainer(index) {
    if(index >= 0 && index <=2) {
       return ` <span class="badge badge-success">${index}</span>`
    } else if(index >= 3 && index <=5) {
        return `<span class="badge badge-warning">${index}</span>`
    } else if(index >= 6 && index <=10) {
        return `<span class="badge badge-danger">${index}</span>`
    } else if(index >= 11 && index <=20) {
        return `<span class="badge badge-danger">${index} !!!</span>`
    }
}

function degToCompass(num) { 
    while( num < 0 ) num += 360;
    while( num >= 360 ) num -= 360;
    const val = Math.round( (num -11.25 ) / 22.5 );
    const arr =["N","NNE","NE","ENE","E","ESE", "SE", 
          "SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
    return arr[ Math.abs(val) ] ;
}

function addLeadingZerosToMin(time) {
    if (parseInt(time, 10) < 10) {
        time = '0' + time;
    }
    return time;
}

// only used for simpleWeather, which seems to be deprecated due to yahoo api.
// remove these later:

//hack to parse simpleweather time xx:xx am | xx:xx: pm to 24h format
// function parseTimeTo24Format(time) {
//     var temp,
//         res = splitTimeToComponents(time);
//     if (time.indexOf("am") !== -1) {
//         temp = parseInt(res[0], 10) + ":" + res[1];
//     } else {
//         temp = parseInt(res[0], 10) + 12 + ":" + res[1];
//     }
//     return temp;
// }

// function splitTimeToComponents(time) {
//     console.log(time:)
//     var temp = time.substring(0, time.indexOf(" ")),
//         res  = temp.split(":");
//     res = addLeadingZerosToMin(res);
//     return res;
// }

// function getAnimationforWeatherCode(weathercode) {
//     var animation;
//     switch (parseInt(weathercode, 10)) {
//     case 0:
//         animation = 'sleet';
//         break;
//     case 1:
//         animation = 'sleet';
//         break;
//     case 2:
//         animation = 'sleet';
//         break;
//     case 3:
//         animation = 'sleet';
//         break;
//     case 4:
//         animation = 'sleet';
//         break;
//     case 5:
//         animation = 'snow';
//         break;
//     case 6:
//         animation = 'snow';
//         break;
//     case 7:
//         animation = 'snow';
//         break;
//     case 8:
//         animation = 'snow';
//         break;
//     case 9:
//         animation = 'rain';
//         break;
//     case 10:
//         animation = 'snow';
//         break;
//     case 11:
//         animation = 'rain';
//         break;
//     case 12:
//         animation = 'rain';
//         break;
//     case 13:
//         animation = 'snow';
//         break;
//     case 14:
//         animation = 'snow';
//         break;
//     case 15:
//         animation = 'snow';
//         break;
//     case 16:
//         animation = 'snow';
//         break;
//     case 17:
//         animation = 'sleet';
//         break;
//     case 18:
//         animation = 'sleet';
//         break;
//     case 19:
//         animation = 'fog';
//         break;
//     case 20:
//         animation = 'fog';
//         break;
//     case 21:
//         animation = 'fog';
//         break;
//     case 22:
//         animation = 'fog';
//         break;
//     case 23:
//         animation = 'wind';
//         break;
//     case 24:
//         animation = 'wind';
//         break;
//     case 25:
//         animation = 'cloudy';
//         break;
//     case 26:
//         animation = 'cloudy';
//         break;
//     case 27:
//         animation = 'partly-cloudy-night';
//         break;
//     case 28:
//         animation = 'partly-cloudy-day';
//         break;
//     case 29:
//         animation = 'partly-cloudy-night';
//         break;
//     case 30:
//         animation = 'partly-cloudy-day';
//         break;
//     case 31:
//         animation = 'clear-night';
//         break;
//     case 32:
//         animation = 'clear-day';
//         break;
//     case 33:
//         animation = 'clear-night';
//         break;
//     case 34:
//         animation = 'clear-day';
//         break;
//     case 35:
//         animation = 'sleet';
//         break;
//     case 36:
//         animation = 'clear-day';
//         break;
//     case 37:
//         animation = 'sleet';
//         break;
//     case 38:
//         animation = 'sleet';
//         break;
//     case 39:
//         animation = 'sleet';
//         break;
//     case 40:
//         animation = 'rain';
//         break;
//     case 41:
//         animation = 'snow';
//         break;
//     case 42:
//         animation = 'snow';
//         break;
//     case 43:
//         animation = 'snow';
//         break;
//     case 44:
//         animation = 'partly-cloudy-day';
//         break;
//     case 45:
//         animation = 'sleet';
//         break;
//     case 46:
//         animation = 'snow';
//         break;
//     default:
//         animation = 'clear-day';
//     }
//     return animation;
// }
