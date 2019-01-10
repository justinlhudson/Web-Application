/**
* Creates the app info for this installed app.
*/
const createConfigInitializeSetting = () => {
  return {
    name: 'Bridge',
    description: 'Bridge into ST',
    id: 'app',
    permissions: ['r:devices:*'],
    firstPageId: '1'
  }
}

/**
* Creates the configuration page for end user to configure this installation.
* @param pageId name of page to send to user
* @param currentConfig the values of the currently set configurations by the user for the settings
*/
const createConfigPage = (pageId, currentConfig) => {
  const app_name = "";

  if (pageId == 1) {
    return {
      pageId: '1',
      name: app_name,
      nextPageId: '2',
      previousPageId: null,
      complete: false,
      sections: []
    }
  }else if (pageId == 2) {
    const app_subname='weather';
    return {
      pageId: '2',
      name: app_subname,
      nextPageId: '3',
      previousPageId: '1',
      complete: false,
      sections: [{
        name: 'Weather Light',
        settings: [{
          id: app_subname+'_active',
          name: "Active?",
          description: "Tap to set",
          type: "BOOLEAN",
          required: false,
          defaultValue: false
        }, {
          id: app_subname+'_zipCode',
          name: 'What 5-digit US Zip Code?',
          description: 'Enter Zip Code',
          type: 'NUMBER',
          required: false
        }, {
          id: app_subname+'_colorLight', // ID of this field
          name: 'Which color light?',
          description: 'Tap to set',
          type: 'DEVICE',
          required: false,
          multiple: false,
          capabilities: ['colorControl', 'switch', 'switchLevel'],
          permissions: ['r', 'x']
        }]
      }]
    }
  } else if (pageId == 3) {
    let app_subname = 'security';
    return {
      pageId: '3',
      name: app_subname,
      nextPageId: '4',
      previousPageId: '2',
      complete: false,
      sections: [{
        name: 'Security System',
        settings: [{
          id: app_subname+'_active',
          name: "Active?",
          description: "Tap to set",
          type: "BOOLEAN",
          required: true,
          defaultValue: false
        },{
          id: app_subname+'_motionsDeactivate',
          name: 'Deactivate Movement',
          type: 'DEVICE',
          required: false,
          multiple: true,
          capabilities: ['motionSensor'],
          permissions: ['r']
        },{
          id: app_subname+'_motionsActivate',
          name: 'Activate Movement',
          type: 'DEVICE',
          required: false,
          multiple: true,
          capabilities: ['motionSensor'],
          permissions: ['r']
        },{
          id: app_subname+'_contactsActivate',
          name: 'Activate Contacts',
          type: 'DEVICE',
          required: false,
          multiple: true,
          capabilities: ['contactSensor'],
          permissions: ['r']
        },{
          id: app_subname+'_switchesDisable',
          name: 'Off/On',
          description: 'Disable',
          type: 'DEVICE',
          multiple: true,
          required: false,
          capabilities: ['switch'],
          permissions: ['r', 'x']
        },{
          id: app_subname+'_minutesInActive',
          name: 'Idle Time to Activate?',
          description: 'Minutes',
          type: 'NUMBER',
          required: false
        },{
          id: app_subname+'_switchesActive',
          name: 'Alarm(s)',
          type: 'DEVICE',
          required: false,
          multiple: true,
          capabilities: ['switch'],
          permissions: ['r', 'x']
        },{
          id: app_subname+'_minutesActive',
          name: 'Time to Alarm?',
          description: 'Minutes',
          type: 'NUMBER',
          required: false
        },{
          id: app_subname+'_emails',
          name: 'Email Alert',
          description: 'Hint: email to text',
          type: 'EMAIL',
          required: false,
          multiple: true
        }]
      }]
    }
  } else if (pageId == 4) {
    let app_subname = 'changes';
    return {
      pageId: '4',
      name: app_subname,
      nextPageId: '5',
      previousPageId: '3',
      complete: false,
      sections: [{
        name: 'Daily Event Changes',
        settings: [{
          id: app_subname+'_active',
          name: "Active?",
          description: "Tap to set",
          type: "BOOLEAN",
          required: true,
          defaultValue: false
        },/* {
          id: app_subname + '_switchesSunriseOn',
          name: 'Sunrise On',
          type: 'DEVICE',
          required: false,
          multiple: true,
          capabilities: ['switch'],
          permissions: ['r', 'x']
        }, {
          id: app_subname + '_switchesSunriseOff',
          name: 'Sunrise Off',
          type: 'DEVICE',
          required: false,
          multiple: true,
          capabilities: ['switch'],
          permissions: ['r', 'x']
      }, {
          id: app_subname + '_switchesSunsetOn',
          name: 'Sunset On',
          type: 'DEVICE',
          required: false,
          multiple: true,
          capabilities: ['switch'],
          permissions: ['r', 'x']
      }, {
          id: app_subname + '_switchesSunsetOff',
          name: 'Sunset Off',
          type: 'DEVICE',
          required: false,
          multiple: true,
          capabilities: ['switch'],
          permissions: ['r', 'x']
        },*/{
          id: app_subname + '_switchesActiveOn',
          name: 'Active On',
          type: 'DEVICE',
          required: false,
          multiple: true,
          capabilities: ['switch'],
          permissions: ['r', 'x']
        }, {
          id: app_subname + '_switchesActiveOff',
          name: 'Active Off',
          type: 'DEVICE',
          required: false,
          multiple: true,
          capabilities: ['switch'],
          permissions: ['r', 'x']
        }, {
          id: app_subname + '_switchesInactiveOn',
          name: 'Inactive On',
          type: 'DEVICE',
          required: false,
          multiple: true,
          capabilities: ['switch'],
          permissions: ['r', 'x']
        }, {
          id: app_subname + '_switchesInactiveOff',
          name: 'Inactive Off',
          type: 'DEVICE',
          required: false,
          multiple: true,
          capabilities: ['switch'],
          permissions: ['r', 'x']
        }]
      }]
    }
  } else if (pageId == 5) {
    const app_subname='logger';
    return {
      pageId: '5',
      name: app_subname,
      nextPageId: null,
      previousPageId: '4',
      complete: true,
      sections: [{
        name: 'Additional Logging',
        settings: [{
          id: app_subname+'_active',
          name: "Active?",
          description: "Tap to set",
          type: "BOOLEAN",
          required: true,
          defaultValue: false
        },{
          id: app_subname+'_switches',
          name: 'Switch(s)',
          type: 'DEVICE',
          required: false,
          multiple: true,
          capabilities: ['switch'],
          permissions: ['r']
        }, {
          id: app_subname+'_motions',
          name: 'Motion(s)',
          type: 'DEVICE',
          required: false,
          multiple: true,
          capabilities: ['motionSensor'],
          permissions: ['r']
        }, {
          id: app_subname+'_contacts',
          name: 'Contact(s)',
          type: 'DEVICE',
          required: false,
          multiple: true,
          capabilities: ['contactSensor'],
          permissions: ['r']
        }, {
          id: app_subname+'_energies',
          name: 'Energ(y,es)',
          type: 'DEVICE',
          required: false,
          multiple: true,
          capabilities: ['energyMeter'],
          permissions: ['r']
        }, {
          id: app_subname+'_powers',
          name: 'Power(s)',
          type: 'DEVICE',
          required: false,
          multiple: true,
          capabilities: ['powerMeter'],
          permissions: ['r']
        }, {
          id: app_subname+'_presences',
          name: 'Presence(s)',
          type: 'DEVICE',
          required: false,
          multiple: true,
          capabilities: ['presenceSensor'],
          permissions: ['r']
        },  {
          id: app_subname+'_waters',
          name: 'Water(s)',
          type: 'DEVICE',
          required: false,
          multiple: true,
          capabilities: ['waterSensor'],
          permissions: ['r']
        }, {
          id: app_subname+'_valves',
          name: 'Valve(s)',
          type: 'DEVICE',
          required: false,
          multiple: true,
          capabilities: ['valve'],
          permissions: ['r']
        }, {
          id: app_subname+'_temperatures',
          name: 'Temperature(s)',
          type: 'DEVICE',
          required: false,
          multiple: true,
          capabilities: ['temperatureMeasurement'],
          permissions: ['r']
        },{
          id: app_subname+'_batteries',
          name: 'Batter(y,ies)',
          type: 'DEVICE',
          required: false,
          multiple: true,
          capabilities: ['battery'],
          permissions: ['r']
        }]
      }]
    }
  }
  return undefined
};

/**
* Creates the configuration required to install this app.
* @param event - the event object.
*/
const setup = (event) => {
  if (!event.config) {
    throw new Error('No config section set in request.');
  }
  let config = {};
  const phase = event.phase;
  const pageId = event.pageId;
  const settings = event.config;
  switch (phase) {
    case 'INITIALIZE':
      config.initialize = createConfigInitializeSetting();
      break;
    case 'PAGE':
      config.page = createConfigPage(pageId, settings);
      break;
    default:
      throw new Error(`Unsupported config phase: ${phase}`);
      break;
  }
  return config;
};

// get ALL pages settings until run out of pages
const settings = () =>
{
  let result = [];
  let page = 1;
  while(true)
  {
    let setting = createConfigPage(page, null);
    if(setting == undefined)
      break;
    result.push(setting);
    page = page + 1;
  }
  return result;
};

module.exports = {
  setup,
  settings
};
