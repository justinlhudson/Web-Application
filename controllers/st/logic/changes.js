const asynclock = require('async-lock');

const lock = new asynclock();

const commands = require('./commands');
const helper = require('./helper');

let _inactivePrev = null;

const handler = async (installedApp, token, devicesInfo, inactive) => {
  const installedConfig = installedApp.config;

  if(devicesInfo === undefined)  // not enough information!
    return;

  lock.acquire('changes', () => {
    // do not repeat if already done operations
    if(_inactivePrev !== null && _inactivePrev === inactive)
      return;
    _inactivePrev = inactive;

    console.info("Inactive: " + inactive);

    /*
    const switchesSunriseOn = helper.devicesConfigContainedIn(installedConfig, devicesInfo, 'changes_switchesSunriseOn');
    const switchesSunriseOff = helper.devicesConfigContainedIn(installedConfig, devicesInfo, 'changes_switchesSunriseOff');

    const switchesSunsetOn = helper.devicesConfigContainedIn(installedConfig, devicesInfo, 'changes_switchesSunsetOn');
    const switchesSunsetOff = helper.devicesConfigContainedIn(installedConfig, devicesInfo, 'changes_switchesSunsetOff');
    */

    if(!inactive) {
      const switchesActiveOn = helper.devicesConfigContainedIn(installedConfig, devicesInfo, 'changes_switchesActiveOn');
      const switchesActiveOff = helper.devicesConfigContainedIn(installedConfig, devicesInfo, 'changes_switchesActiveOff');

      if(switchesActiveOn !== undefined)
       activate(token, switchesActiveOn);
      if(switchesActiveOff !== undefined)
        deactivate(token, switchesActiveOff);
    }
    else {
      const switchesInactiveOn = helper.devicesConfigContainedIn(installedConfig, devicesInfo, 'changes_switchesInactiveOn');
      const switchesInactiveOff = helper.devicesConfigContainedIn(installedConfig, devicesInfo, 'changes_switchesInactiveOff');

      if(switchesInactiveOn !== undefined)
        activate(token, switchesInactiveOn);
      if(switchesInactiveOff !== undefined)
        deactivate(token, switchesInactiveOff);
    }
  }).then ( () => {

  })
};

const activate = async (token, devices) => {
  devices.forEach((device) => {
    commands.device(token, device.id, [{
      command: 'on',
      capability: 'switch',
      component: 'main',
      arguments: []
    }])
      .catch((err) => {
        console.error('Error execute command');
        console.error(prettyjson.render(err, prettyjsonOptions));
      })
  });
};

const deactivate = async (token, devices) => {
  devices.forEach((device) => {
    commands.device(token, device.id, [{
      command: 'off',
      capability: 'switch',
      component: 'main',
      arguments: []
    }])
      .catch((err) => {
        console.error('Error execute command');
        console.error(prettyjson.render(err, prettyjsonOptions));
      })
  });
};

module.exports = {
  handler
};
