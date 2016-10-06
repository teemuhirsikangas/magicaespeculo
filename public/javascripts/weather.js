'use strict';
var weather = function () {
        $.simpleWeather({
            location: config.weather.location,
            woeid: config.weather.woeid,
            unit: config.weather.unit,
            success: function (weather) {
                var skycons = new Skycons({"color": "white"}),
                    skycons_forecast = new Skycons({"color": "white"}),
                    current_weather = '<canvas id="weather-icon" width="128" height="128"></canvas>',
                    sunrise = parseTimeTo24Format(weather.sunrise),
                    sunset = parseTimeTo24Format(weather.sunset);
                current_weather += '<div id= weather_desc>' + weather.currently + '</div>';
                current_weather += '<div>' + weather.wind.direction + ' ' + weather.wind.speed + ' ' + weather.units.speed + '</div>';
                current_weather += '<div><canvas id=sunrise width="18" height="18"> </canvas>' + sunrise + '<canvas id=sunset width="18" height="18"> </canvas> ' + sunset + '</div>';
                $("#weather_now").html(current_weather);
                var date,
                    weekday,
                    forecast,
                    forecastValue,
                    forecastIcons,
                    i;
                for (i = 0; i < weather.forecast.length; i++) {
                    date = moment(new Date(weather.forecast[i].date));
                    weekday = date.isoWeekday();
                    forecast = days[weekday];
                    forecastValue = weather.forecast[i].high + ' ' + weather.forecast[i].low;
                    forecastIcons = "<canvas id=weather-forecast-" + i + "> </canvas>";
                    $("#weather-forecast-day-" + i).html(forecast);
                    $("#weather-forecast-value-" + i).html(forecastValue);
                    $("#weather-forecast-icon-" + i).html(forecastIcons);
                }

                skycons_forecast.add("sunrise", getAnimationforWeatherCode());
                skycons_forecast.add("sunset", getAnimationforWeatherCode(31));

                for (i = 0; i < weather.forecast.length; i++) {
                    skycons_forecast.add("weather-forecast-" + i, getAnimationforWeatherCode(weather.forecast[i].code));
                }

                skycons.remove('weather-icon');
                var animation = getAnimationforWeatherCode(weather.code);
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

//hack to parse simpleweather time xx:xx am | xx:xx: pm to 24h format
function parseTimeTo24Format(time) {
    var temp,
        res = splitTimeToComponents(time);
    if (time.indexOf("am") !== -1) {
        temp = parseInt(res[0], 10) + ":" + res[1];
    } else {
        temp = parseInt(res[0], 10) + 12 + ":" + res[1];
    }
    return temp;
}

function splitTimeToComponents(time) {
    var temp = time.substring(0, time.indexOf(" ")),
        res  = temp.split(":");
    res = addLeadingZerosToMin(res);
    return res;
}

function addLeadingZerosToMin(time) {

    if (parseInt(time[1], 10) < 10) {
        //var temp = time[1];
        time[1] = 0 + time[1];
    }
    return time;
}

function getAnimationforWeatherCode(weathercode) {
    var animation;
    switch (parseInt(weathercode, 10)) {
    case 0:
        animation = 'sleet';
        break;
    case 1:
        animation = 'sleet';
        break;
    case 2:
        animation = 'sleet';
        break;
    case 3:
        animation = 'sleet';
        break;
    case 4:
        animation = 'sleet';
        break;
    case 5:
        animation = 'snow';
        break;
    case 6:
        animation = 'snow';
        break;
    case 7:
        animation = 'snow';
        break;
    case 8:
        animation = 'snow';
        break;
    case 9:
        animation = 'rain';
        break;
    case 10:
        animation = 'snow';
        break;
    case 11:
        animation = 'rain';
        break;
    case 12:
        animation = 'rain';
        break;
    case 13:
        animation = 'snow';
        break;
    case 14:
        animation = 'snow';
        break;
    case 15:
        animation = 'snow';
        break;
    case 16:
        animation = 'snow';
        break;
    case 17:
        animation = 'sleet';
        break;
    case 18:
        animation = 'sleet';
        break;
    case 19:
        animation = 'fog';
        break;
    case 20:
        animation = 'fog';
        break;
    case 21:
        animation = 'fog';
        break;
    case 22:
        animation = 'fog';
        break;
    case 23:
        animation = 'wind';
        break;
    case 24:
        animation = 'wind';
        break;
    case 25:
        animation = 'cloudy';
        break;
    case 26:
        animation = 'cloudy';
        break;
    case 27:
        animation = 'partly-cloudy-night';
        break;
    case 28:
        animation = 'partly-cloudy-day';
        break;
    case 29:
        animation = 'partly-cloudy-night';
        break;
    case 30:
        animation = 'partly-cloudy-day';
        break;
    case 31:
        animation = 'clear-night';
        break;
    case 32:
        animation = 'clear-day';
        break;
    case 33:
        animation = 'clear-night';
        break;
    case 34:
        animation = 'clear-day';
        break;
    case 35:
        animation = 'sleet';
        break;
    case 36:
        animation = 'clear-day';
        break;
    case 37:
        animation = 'sleet';
        break;
    case 38:
        animation = 'sleet';
        break;
    case 39:
        animation = 'sleet';
        break;
    case 40:
        animation = 'rain';
        break;
    case 41:
        animation = 'snow';
        break;
    case 42:
        animation = 'snow';
        break;
    case 43:
        animation = 'snow';
        break;
    case 44:
        animation = 'partly-cloudy-day';
        break;
    case 45:
        animation = 'sleet';
        break;
    case 46:
        animation = 'snow';
        break;
    default:
        animation = 'clear-day';
    }
    return animation;
}
