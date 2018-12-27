// Reference(s):
// https://smartthings.developer.samsung.com/develop/index.html
// https://smartthings.developer.samsung.com/develop/api-ref/st-api.html
// https://smartthings.developer.samsung.com/develop/api-ref/smartapps-v1.html

const fs = require('fs');
const path = require("path");

const commands = require('./logic/commands');
const configuration = require('./logic/configuration');
const helper = require('./logic/helper');

const environment = require.main.require('./configuration/environment.json');

// Biz Logic
const weatherlight = require('./logic/weatherlight');
const security = require('./logic/security');
const logger = require('./logic/logger');
const changes = require('./logic/changes');

const publicKey = fs.readFileSync(path.resolve(__dirname, 'data/smartthings_rsa.pub'), 'utf8');

let devicesInfo;  // lazy cache stores ALL device details to match by ID during operation

const entry = async (request, response) => {
  // We don't yet have the public key during PING (when the app is created),
  // so no need to verify the signature. All other requests are verified.
  // Todo: FIX verification!!!!!!
  if ((request.body && request.body.lifecycle === "PING") || helper.signatureIsVerified(request, publicKey))
    await handleRequest(request, response)
  else
    response.status(401).send("Forbidden");
};

const handleRequest = async (request, response) => {
  let event = request.body;
  let lifecycle = event.lifecycle;

  //console.log(`${lifecycle} lifecycle. Request body:`);
  //console.log(prettyjson.render(event, prettyjsonOptions));

  switch(lifecycle) {
    // PING happens during app creation. Purpose is to verify app
    // is alive and is who it says it is.
    case 'PING': {
      let challenge = event.pingData.challenge;
      response.json({statusCode: 200, pingData: {challenge: challenge}});
      break;
    }
    // CONFIGURATION happens as user begins to install the app.
    case 'CONFIGURATION': {
      let configData = configuration.setup(event.configurationData);
      //console.log(prettyjson.render({configurationData: configData}, prettyjsonOptions));
      response.json({statusCode: 200, configurationData: configData});
      break;
    }
    // INSTALL happens after a user finishes configuration, and installs the app.
    case 'INSTALL': {
      let installedApp = event.installData.installedApp;
      let installedData = event.installData;
      await uninitializeApp(installedApp, installedData);
      await initializeApp(installedApp, installedData);
      response.json({statusCode: 200, installData: {}});
      break;
    }
    // UPDATE happens when a user updates the configuration of an already-installed app.
    case 'UPDATE': {
      let installedApp = event.updateData.installedApp;
      let installedData = event.updateData;
      await uninitializeApp(installedApp, installedData);
      await initializeApp(installedApp, installedData);
      response.json({statusCode: 200, updateData: {}});
      break;
    }
    // UNINSTALL happens when a user uninstalls the app.
    case 'UNINSTALL': {
      //uninitializeApp(installedApp, token);
      response.json({statusCode: 200, uninstallData: {}});
      break;
    }
    case 'EXECUTE': {
      console.log("EXECUTE"); // seems new seen when fires (note: only when using samsung app)!
      response.json({statusCode: 200, executeData: {}}); // just guessing response ???
      break;
    }
    // EVENT happens when any subscribed-to event or schedule executes.
    case 'EVENT': {
      await handleEvent(event.eventData);
      response.json({statusCode: 200, eventData: {}});
      break;
    }
    default: {
      console.info(`Lifecycle ${lifecycle} not supported`);
    }
  }
};

const stStorage = (data = undefined) => {
  return new Promise((resolve, reject) => {
    let file = path.resolve(__dirname, 'data', 'st_storage.json');
    if (typeof data !== 'undefined' && data) {
      if (typeof data !== "string") data = JSON.stringify(data);
      fs.writeFile(file, data, 'utf8', (error) => {
        if (error) {
          console.error(error);
          reject(error);
        } else {
          resolve(data);
        }
      });
    } else {
      fs.readFile(file, 'utf8', (error, data) => {
        if (error) {
          console.error(error);
          reject(error);
        } else {
          resolve(JSON.parse(data)); //now it an object
        }
      });
    }
  });
};

const uninitializeApp = async (stApp, stData) => {
  let token = stData.authToken;

  await Promise.all([commands.unschedule(stApp,token),commands.unsubscribe(stApp,token)])
    .then( () => {}).catch((err) => { console.error(err); });
};

const initializeApp = async (stApp, stData) => {
  const token = stData.authToken;

  const refreshToken = stData.refreshToken;
  if(typeof(refreshToken) !== 'undefined' && refreshToken )
  {
    let data = await stStorage();  // in-case is other data inside, do not replace
    data.refreshToken = refreshToken;
    stStorage(data); // don't need to wait
  }

  devicesInfo = await devicesInfoHandler(token).catch((err) => { console.error(err); });  // list ALL devices relevant info, get in once-shot

  const stConfig = stApp.config;
  const settings = configuration.settings();  // configuration pages
  let devicesSubscription = []; // devices to subscribe to at then end (don't want repeats)

  // Weather
  if(stConfig.weather_active[0] &&  stConfig.weather_active[0].stringConfig.value === 'true') {
    let interval = 15; // minutes
    await commands.schedule(stApp, token, 'weather', interval).catch((err) => { console.error(err); });
  }

  // Security
  // https://smartthings.developer.samsung.com/docs/api-ref/capabilities.html
  if(stConfig.security_active[0] &&  stConfig.security_active[0].stringConfig.value === 'true') {
    /* Todo: figure this out, why not works to save on available subrscriptions
    commands.subscribe(stApp, token, 'capability', `motions`, {'capability': 'motionSensor', 'attribute': 'motion'}).catch((err) => { console.error(err); })
    commands.subscribe(stApp, token, 'capability', `contacts`, {'capability': 'contactSensor', 'attribute': 'contact'}).catch((err) => { console.error(err); })
    */

    // 5 min. is token timeout, so can get a new one so can use whenever...
    let interval = 4; // minutes
    await commands.schedule(stApp, token, 'security', interval).catch((err) => { console.error(err); });

    helper.devicesConfigured(stConfig, 'security').forEach(device => {
      let id = device.deviceConfig.deviceId;

      // find motion sensors
      if(devicesInfo.filter(info => info.id === id && info.capabilities.includes('motionSensor')).length > 0) {
        devicesSubscription.push({name: 'security', device: device});
      }
      // find contact sensors
      if(devicesInfo.filter(info => info.id === id && info.capabilities.includes('contactSensor')).length > 0) {
        devicesSubscription.push({name: 'security', device: device});
      }
    }); //find and push to master list
  }

  // Changes
  /* Todo:  when add more features, turn this on...
  if(stConfig.changes_active[0] &&  stConfig.changes_active[0].stringConfig.value == 'true') {
    let interval = 15; // minutes
    await commands.schedule(stApp, token, 'changes', interval).catch((err) => { console.error(err); });
  }
  */

  // Logger
  if(stConfig.logger_active[0] &&  stConfig.logger_active[0].stringConfig.value === 'true') {
    // Find ALL device property id's that have 'logger' in the name
    helper.devicesConfigured(stConfig, 'logger').forEach(device => { devicesSubscription.push({name: 'logger', device: device});});  //find and push to master list
  }

  // Subscribe to each individual device, for ALL capabilities
  devicesSubscription = helper.devicesUnique(devicesSubscription); // unique device id's, meaning if repeated
  if (devicesSubscription.length > 0) {
    let deviceCounter = 0;  // they each need their own subscription, so easy naming counter...
    devicesSubscription.forEach( subscription => {
      commands.subscribe(stApp, token, 'device', `${deviceCounter}`, subscription.device.deviceConfig).catch((err) => { console.error(err); })
      deviceCounter = deviceCounter + 1;
    });
  }

  // daily
  await commands.schedule(stApp, token, 'refresh', 1440).catch((err) => { console.error(err); });

  console.log(`Device Subscriptions: ${devicesSubscription.length}`);
};

const handleEvent = async (stData) => {
  const token = stData.authToken;
  const stApp = stData.installedApp;
  const stConfig = stData.installedApp.config;

  // in-case app re-started for whatever reason without install or update issued
  if(!devicesInfo)
    devicesInfo = await devicesInfoHandler(token).catch((err) => { console.error(err); });

  //for(let eventItem in stData.events) {
  stData.events.forEach(eventItem => {
    let eventType = eventItem.eventType;
    if("DEVICE_EVENT" === eventType) {
      let deviceEvent = eventItem.deviceEvent;

      logHandler(deviceEvent).catch((err) => { console.error(err); });  // logHandler ANY and ALL events to DB

      security.handler(stApp, token, deviceEvent, devicesInfo) // handler will determine if event is relevant
        .then ( (armed) => {
          changes.handler(stApp, token, devicesInfo, armed).catch((err) => { console.error(err); });
        })
        .catch((err) => { console.error(err); })
    }
    else if ("TIMER_EVENT" === eventType) {
      const timerEvent = eventItem.timerEvent;
      const timerName = timerEvent.name.toLowerCase();

      if(timerName.includes('weather')) {
        weatherlight.handler(stApp, token).catch((err) => { console.error(err); });
      }

      if(timerName.includes('security') || timerName.includes('changes')) {
        security.handler(stApp, token)
          .then ( (armed) => {
            changes.handler(stApp, token, devicesInfo, armed).catch((err) => { console.error(err); });
          })
          .catch((err) => { console.error(err); })
      }

      if(timerName.includes('refresh')) {
        stStorage()
          .then( (data) => {
            commands.tokenRefresh({'clientId': environment.ST.CLIENT_ID, 'clientSecret': environment.ST.CLIENT_SECRET, 'refreshToken': data.refreshToken})
              .then((response) => {
                if (typeof response === "string") response = JSON.parse(response); // to json
                data.refreshToken = response.refresh_token;
                stStorage(data);
              })
          })
          .catch(function (err) {
            console.error(err);
          });

        // Todo: refresh all devices command
        /*
        helper.devicesConfigured(stConfig, undefined).forEach(device => {
          let id = device.deviceConfig.deviceId;
        });
        */
      }
    } else {
      console.warn(`Unhandled event of type ${eventItem.eventType}`)
    }
  });
};

const devicesInfoHandler = (token) => {
  return new Promise( (resolve, reject) => {
    commands.devices(token)
      .then(function (response) {
        let devicesInfo = response;
        let devicesInfoSubset = helper.devicesSubsetInfo((devicesInfo))
        resolve(devicesInfoSubset);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

const logHandler = async (deviceEvent) => {
  let name = deviceEvent.deviceId;  // how to get actual name?
  let type = deviceEvent.attribute;
  let value = deviceEvent.value;

  if (devicesInfo != null) {
    devicesInfo.forEach(device => {
      if (device.id == name) {
        name = device.name;
      }
    });
  }

  let params ={'name': name, 'type': type, 'value': value}
  console.debug(params);

  return await logger.add(params); //reject(err)
};

module.exports = {entry};
