const rp = require('request-promise');
const querystring = require('querystring');
const prettyjson = require('prettyjson');
const prettyjsonOptions = {};

const stApiUrl = 'https://api.smartthings.com/v1';

const unschedule = (installedApp, token, name=null) => {
  let path = `/installedapps/${installedApp.installedAppId}/schedules`;
  if( name !== null) {
    path = `/installedapps/${installedApp.installedAppId}/schedules/${name}_schedule`;
  }

  const options = {
    url: `${stApiUrl}${path}`,
    method: 'DELETE',
    json: true,
    headers: {
      'Authorization': 'Bearer ' + token
    }
  };
  return rp(options);
};

const schedule = (installedApp, token, name, interval) => {
  const path = `/installedapps/${installedApp.installedAppId}/schedules`;
  const scheduleRequest = {
    once: null,
    name: `${name}_schedule`,
    cron: {
      expression: `0/${interval} * * * ? *`,
      timezone: "UTC"
    }
  };
  const options = {
    url: `${stApiUrl}${path}`,
    method: 'POST',
    json: true,
    body: scheduleRequest,
    headers: {
      'Authorization': 'Bearer ' + token
    }
  };
  return rp(options);
};

/**
 * Builds and returns a Bluebird Request Promise to device a
 * SmartThings-connected device.
 *
 * @param {string} id - the ID of the device to device.
 * @param {string} token - the Auth token to use for the request.
 * @param {Object[]} commands - The commands request body to send.
 *
 * @returns {Promise} A request-promise for the request.
 */
const device = (token, id, commands) => {
  const path = `/devices/${id}/commands`;

  const options = {
    url: `${stApiUrl}${path}`,
    method: 'POST',
    json: true,
    body: commands,
    headers: {
      'Authorization': 'Bearer ' + token
    }
  };
  return rp(options);
};

const devices = (token) => {
  const path = `/devices`;

  const options = {
    url: `${stApiUrl}${path}`,
    method: 'GET',
    json: true,
    headers: {
      'Authorization': 'Bearer ' + token
    }
  };
  return rp(options);
};

const status = (token, id) => {
  const path = `/devices/${id}/status`;

  const options = {
    url: `${stApiUrl}${path}`,
    method: 'GET',
    json: true,
    headers: {
      'Authorization': 'Bearer ' + token
    }
  };
  return rp(options);
};

// on install and update?
// let deviceConfig = installedApp.config.contactSensor[0].deviceConfig;
const subscribe = (installedApp, token, type, name, config) => {
  const path = `/installedapps/${installedApp.installedAppId}/subscriptions`;
  let options = {};

  // create a subscription to a device for any capability and attribute event
  if (type === 'device') {
    options = {
      sourceType: 'DEVICE',
      device: {
        deviceId: config.deviceId,
        componentId: config.componentId,
        capability: '*',  // all
        attribute: '*', // any
        stateChangeOnly: true,
        subscriptionName: `${name}_subscription`,
        value: '*' // any
      }
    };
  }
  else if (type === 'capability') {
    options = {
      sourceType: 'CAPABILITY',
      capability: {
        locationId: installedApp.locationId,
        capability: config.capability,
        attribute:  config.attribute,
        stateChangeOnly: true,
        subscriptionName: `all_${name}_subscription`,
        value: '*' // any
      }
    }
  }

  const request = {
    url: `${stApiUrl}${path}`,
    method: 'POST',
    json: true,
    body: options,
    headers: {
      'Authorization': 'Bearer ' + token
    }
  };

  //console.log("Device subscription request:");
  //console.log(prettyjson.render(request, prettyjsonOptions));
  return rp(request);
};

const unsubscribe = (installedApp, token, name=null) => {
  let path = `/installedapps/${installedApp.installedAppId}/subscriptions`;
  if( name !== null) {
    path = `/installedapps/${installedApp.installedAppId}/subscriptions/${name}_subscription`;
  }
  const options = {
    url: `${stApiUrl}${path}`,
    method: 'DELETE',
    json: true,
    headers: {
      'Authorization': 'Bearer ' + token
    }
  };
  return rp(options)
};

// https://smartthings.developer.samsung.com/docs/guides/smartapps/auth-and-permissions.html?highlight=grant_type
const tokenRefresh = (data) => {
  const options = {
    url: `https://auth-global.api.smartthings.com/oauth/token`,
    method: 'POST',
    auth: {
      'user': data.clientId,
      'pass': data.clientSecret
    },
    formData: {
      grant_type: 'refresh_token',  // Specify refresh_token to receive a new token.
      client_id: data.clientId,  // The client ID of your SmartApp.
      client_secret: data.clientSecret,  // The client secret of your SmartApp.
      refresh_token: data.refreshToken  // The latest unexpired refresh token received by your SmartApp during the INSTALL or UPDATE phase.
    },
    headers: {
      /* 'content-type': 'application/x-www-form-urlencoded' */ // Is set automatically
    }
  };
  return rp(options);
};

module.exports = {
  schedule,
  unschedule,
  subscribe,
  unsubscribe,
  device,
  devices,
  status,
  tokenRefresh
};
