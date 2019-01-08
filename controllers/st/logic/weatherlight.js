const commands = require('./commands');
const rp = require('request-promise');
const prettyjson = require('prettyjson');
const prettyjsonOptions = {};

const environment = require.main.require('./configuration/environment.json');

const weatherUrl = 'https://api.openweathermap.org/data/2.5';
const weatherApiKey = environment.ST.WEATHER_API_KEY;

const colorType = {
  RED: {hue: 100, saturation: 0},
  ORANGE: {hue: 10, saturation: 100},
  YELLOW: {hue: 15, saturation: 90},
  GREEN: {hue: 25, saturation: 85},
  BLUE: {hue: 60, saturation: 70},
  PURPLE: {hue: 75, saturation: 90},
  WHITE: {hue: 0, saturation: 60}
};

/**
 * Returns a Bluebird Promise for getting the current weather.
 * @param {string} zipCode - A valid, 5-digit zip code for the are to get
 *    the weather for.
 * @returns {Promise} the Bluebird request-promise for this request.
 */
const getCurrentWeather = (zipCode) => {
  const options = {
    url: `${weatherUrl}/weather`,
    qs: {
      zip: zipCode,
      units: 'imperial',
      APPID: weatherApiKey
    },
    json: true
  };
  return rp(options);
};

/**
 * Returns a Bluebird Promise for getting the weather forecast.
 * @param {string} zipCode - A valid, 5-digit zip code for the are to get
 *    the weather for.
 * @returns {Promise} the Bluebird request-promise for this request.
 */
const getForecast = (zipCode) => {
  const options = {
    url: `${weatherUrl}/forecast`,
    qs: {
      zip: zipCode,
      units: 'imperial',
      APPID: weatherApiKey
    },
    json: true
  };
  return rp(options);
};

/**
 * Returns the hue and saturation values for a given forecast and chunks (in 3 hour intervals from current time):
 *
 * Any precipitation will return values for the color Purple, regardless of
 *   temp.
 * Any forecast temperature greater than 80 degrees Fahrenheit return values
 *   for orange.
 * Any forecast temperature less than 50 degress Fahrenheit return values for
 *   blue.
 * Any other forecast temperature or conditions return values for soft white.
 *
 * @param {Object} weather - The current forecast.
 * @param {number} chunks - The number of forecast chunks to check (each chunk
 *   is 3 hours)
 * @returns {Object} The hue and saturation values. E.g., {hue: 23, saturation: 100}
 */
const getColorForForecast = (weather, chunks) => {
  let forecast = weather.list.slice(0, chunks);
  let precipitation = false;
  let windy = false;

  let temps = forecast.map(function(item) {
    return item.main.temp;
  });

  let conditions = forecast.map(function(item) {
    return item.weather[0].main;
  });

  let winds = forecast.map(function(item) {
    return item.wind.speed;
  });

  let highestTemp = Math.max(temps);
  let lowestTemp = Math.min(temps);

  //     (conditions.indexOf('Mist') > -1) ||
  if ((conditions.indexOf('Rain') > - 1) ||
    (conditions.indexOf('Snow') > -1)) {
    precipitation = true;
  }

  windy = winds.every((w) => {
    if(w > 15)
      return true;
  });

  // Todo: scale color if temp is growing verse cooling and something cool...
  let color = null;
  if (precipitation) {
    color = colorType.PURPLE;
  } else if(windy) {
    color = colorType.ORANGE;
  } else if (highestTemp > 80) {
    color = colorType.YELLOW;
  } else if (lowestTemp < 60) {
    color = colorType.BLUE;
  } else {
    color = colorType.WHITE;
  }

  console.log(`Weather color values: ${prettyjson.render(color, prettyjsonOptions)}`);
  return color;
};

const handler = async (installedApp, token) => {
  const zipCode = installedApp.config.weather_zipCode[0].stringConfig.value;
  const deviceId = installedApp.config.weather_colorLight[0].deviceConfig.deviceId;

  const chunks = 4; // 1=3hrs, 2=6hrs, 3=9hrs, 4=12hrs
  try {
    getForecast(zipCode)
      .then( (forecast) => {
        try {
          const color = getColorForForecast(forecast, chunks);
          commands.device(token, deviceId, [
            {
              command: 'on',
              capability: 'switch',
              component: 'main',
              arguments: []
            },
            {
              command: 'setLevel',
              capability: 'switchLevel',
              component: 'main',
              arguments: [5]
            },
            {
              command: 'setColor',
              capability: 'colorControl',
              component: 'main',
              arguments: [color]
            }
          ])
        } catch (error) { console.error(error);}
      }).catch( (error) => { console.error(error); })
  } catch (error) { console.error(error);}
};

module.exports = {
  handler
};
