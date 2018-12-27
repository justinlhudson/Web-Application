const prettyjson = require('prettyjson');
const prettyjsonOptions = {};

const configuration = require.main.require('./configuration/environment.json');

const commands = require('./commands');
const helper = require('./helper');
const shell = require('shelljs');
const asynclock = require('async-lock');

const lock = new asynclock();

let _armSecurity = undefined;
let _activeSecurity = undefined;

let _disables = undefined;
let _armed = true;  // ready at the start
let _active = false;

let _token = undefined;

// Init. Defaults
let _minutesInActive = 15;
let _minutesActive = 1;
let _switchesActive = undefined;
let _switchesActivePrev = undefined;
let _switchesDisable = undefined;
let _emails = undefined;

const _emailMessage = (message) => {
  _emails.forEach(email => {
    console.log(message);
    shell.exec(`ssh -t `+configuration.EMAIL_SERVER+` "echo Security System - ${message} | /usr/sbin/ssmtp ${email}"`)
  });
};

const disables = async () => {
  let promises = [];
  if(_switchesDisable !== undefined) {
    _switchesDisable.forEach((device) => {
      promises.push(new Promise( (resolve, reject) => {
        commands.status(_token, device.id)
          .then((response) => {
            if (response.components.main.switch.switch.value === 'on')
              resolve(1);
            else
              resolve(0);
          }).catch((err) => {
            resolve(0); // worst case turn on security!
        });
      }));
    });
  }

  let results = await Promise.all(promises);
  let count = results.reduce((a, b) => a + b, 0); // add
  return count;
};

const arming = (minutes) => {
  return new Promise( (resolve, reject) => {
    lock.acquire('arming', () => { // event loops can fire multiple events at same time
      // clear and set timer (i.e. reset)
      if (!(_armSecurity === undefined)) {  // arming reset
        clearTimeout(_armSecurity);
        _armSecurity = undefined;
        _armed = false;
      }
    }).then(() => {
      // clear active state is arming again...
      if (_armSecurity === undefined) {
        _armSecurity = setTimeout(() => {  // arming timeout
          disables().then((count) => {
            if( count <= 0 ){
              console.log('Armed...');
              _emailMessage("Armed...");

              _armed = true;
              _active = false;
            };
          });
        }, 1000 * 60 * minutes);
      };
    });
    resolve();
  });
};

const activate = (minutes) => {
  return new Promise( (resolve, reject) => {
    const switches = _switchesActive;
    const emails = _emails;
    lock.acquire('activate', () => { // event loops can fire multiple events at same time
      disables().then((count) => {
        if(count <= 0) {
          if (_activeSecurity === undefined) {
            _activeSecurity = setTimeout(() => {
              console.log('De-Activated!!!');
              _emailMessage("De-Activated!!!");

              _activeSecurity = undefined; // reset
              _active = false;
              _armed = false;
              arming(_minutesInActive);  // set arming again, no need for motion first

              // Put switches back to original state before alarm!
              if (!(_switchesActivePrev === undefined)) {
                _switchesActivePrev.forEach((device) => {
                  commands.device(_token, device.id, [{
                    command: device.value,
                    capability: 'switch',
                    component: 'main',
                    arguments: []
                  }]).catch((err) => {
                      console.error('Error execute command');
                      console.error(prettyjson.render(err, prettyjsonOptions));
                  })
                });
              }
            }, 1000 * 60 * minutes);

            console.log('Activated!!!');
            _emailMessage("Actived!!!");

            _active = true;
            _switchesActivePrev = []; // clear
            if (!(switches === undefined)) {
              switches.forEach((device) => {
                // store original state before activating.
                commands.status(_token, device.id).then((response) => {
                    let temp = device;
                    temp.value = response.components.main.switch.switch.value;
                    _switchesActivePrev.push(temp);

                    commands.device(_token, temp.id, [{
                      command: temp.value === 'on' ? 'off' : 'on',  // toggle
                      capability: 'switch',
                      component: 'main',
                      arguments: []
                    }]).catch((err) => {
                      console.error('Error execute command');
                      console.error(prettyjson.render(err, prettyjsonOptions));
                    })
                  }).catch((err) => {
                    console.error('Error status command');
                    console.error(prettyjson.render(err, prettyjsonOptions));
                  });
              });
            };
          };
        } else {
          _activeSecurity = undefined; // reset
          _active = false;
          _armed = false;
          arming(_minutesInActive);  // set arming again, no need for motion first
        }
        resolve();
      }).catch((err) => {
        reject(err);
      });
    });
  });
};

const handler = async (installedApp, token, deviceEvent=undefined, devicesInfo=undefined) => {
  let installedConfig = installedApp.config;

  _token = token; // lazy sharing, updating on timer subscription

  // is timer event!
  if(deviceEvent === undefined || devicesInfo === undefined) {
    if(_disables > 0)
      return false;
    return _armed || _active;
  }

  let id = deviceEvent.deviceId;
  let value = deviceEvent.value;
  let capability = deviceEvent.capability;

  // only care about these events!
  if(!(capability === 'motionSensor') && !(capability === 'contactSensor'))
    return _armed || _active;

  // Settings De-code from App Configuration
  _minutesInActive = helper.stringValuesConfigured(installedConfig, 'security_minutesInActive')[0];
  _minutesActive = helper.stringValuesConfigured(installedConfig, 'security_minutesActive')[0];
  _switchesActive = helper.devicesConfigContainedIn(installedConfig, devicesInfo, 'security_switchesActive');
  if(_switchesActive === undefined)  // Keeping old name from config?
    _switchesActive = helper.devicesConfigContainedIn(installedConfig, devicesInfo, 'security_switchesAlarm');
  _switchesDisable = helper.devicesConfigContainedIn(installedConfig, devicesInfo, 'security_switchesDisable');

  _emails = helper.stringValuesConfigured(installedConfig, 'security_emails');

  // returns 'undefined' if Id of event not in one of these lists
  let motionDeactivate = helper.devicesConfigContainedIn(installedConfig, devicesInfo, 'security_motionsDeactivate', id);
  let motionActivate = helper.devicesConfigContainedIn(installedConfig, devicesInfo, 'security_motionsActivate', id);
  let contactActivate = helper.devicesConfigContainedIn(installedConfig, devicesInfo, 'security_contactsActivate', id);
  let switchDisable = helper.devicesConfigContainedIn(installedConfig, devicesInfo, 'security_switchesDisable', id);

  // event was not for this, thus ignore...
  if (motionDeactivate === undefined && motionActivate === undefined && contactActivate === undefined)
    return _armed || _active;

  // re-arm, if not already armed
  if (!_armed) {
    await arming(_minutesInActive);
  } else if (_armed) {
    // Motion Deactivate
    if (!(motionDeactivate === undefined)) {
      await arming(_minutesInActive * 0.25); // re-arm, 1/4 the time in this case (i.e. if just walking past de-arm and nothing else)
    } else {
      // Motion/Contacts Activate
      if (!(motionActivate === undefined) || !(contactActivate === undefined)) {
        // Todo:  email device name that activated!
        await activate(_minutesActive);
      }
    }
  }

  return _armed || _active;
};

module.exports = {
  handler
};
