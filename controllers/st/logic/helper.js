const utility = require('util');
const httpSignature = require('http-signature');
const helper_app = require.main.require('./helpers/helper');

const signatureIsVerified = (request, publicKey) => {
  try {
    const parsed = httpSignature.parseRequest(request);
    //console.trace(parsed);
    if (!httpSignature.verifySignature(parsed, publicKey)) {
      // console.warn('forbidden - failed verifySignature');
      // Todo: not this!
      if(parsed.params.keyId.includes('SmartThings'))
        return true;
      return false;
    };
  } catch (error) {
    console.error(error);
    return false;
  };
  return true;
};

const appConfigProperty = (configuration, includes = undefined) => {
  let properties = [];
  for (const propertyName in configuration) {
    if (propertyName.includes(includes) || includes === undefined) {
      let property = configuration[propertyName];
      if (utility.isArray(property) && property.length > 0) {
        property.forEach(element => {
          properties.push(element)
        });
      };
    };
  };
  return properties;
};

const devicesConfigured = (configuration, includes = undefined) => {
  let devices = [];
  self.appConfigProperty(configuration, includes).forEach(element => {
    if (typeof(element.valueType) !== 'undefined' && element.valueType === 'DEVICE') {  // if is array check if as an item and if that item is a device type
      devices.push(element);
    };
  });
  return devices;
};

const devicesUnique = (items) => {
  let flags = {};
  items = items.filter((item) => {
    const entry = item.device.deviceConfig.deviceId;
    if (flags[entry])
      return false;
    flags[entry] = true;
    return true;
  });

  return items;
};

const devicesSubsetInfo = (info) => {
  let devicesInfoSub = info.items.map(obj => {
    // correct naming with label lookup name
    let name = (obj.label ? obj.label : obj.name)

    let objNew = {
      id: obj.deviceId,
      name: name,
      capabilities: obj.components[0].capabilities.map(c => {
        return c.id;
      })
    };
    return objNew;
  });
  return devicesInfoSub
};

/**
 * Takes application configuration and device info to return the device Id if it is contained in the correct configuration settings.
 * @param {dictonary} configuration - Configured settings for application
 * @param {array} devicesInfo - ALL device information for application
 * @param {string} deviceID - GUID string of device ID to match on
 * @param {string} name - Name of property to search for ID in configuration
 * @param {string} id - Specific device to search for
 * @return {dictonary} the device information or Empty
 **/
const devicesConfigContainedIn = (configuration, devicesInfo, name, id = undefined) => {

  // list of devices included in property
  let devicesConfigured = self.devicesConfigured(configuration, name);
  if (helper_app.isEmpty(devicesConfigured))
    return undefined;

  if(id === undefined) {

    let deviceInfo = [];
    devicesConfigured.forEach( (device) => {
      deviceInfo.push(devicesInfo.filter(d => d.id === device.deviceConfig.deviceId)[0])
    });
    return deviceInfo;
  };

  // find device if property list
  let deviceConfiguredSubset =  devicesConfigured.filter(d => d.deviceConfig.deviceId === id) // should only be one, if any
  if (helper_app.isEmpty(deviceConfiguredSubset))
    return undefined;

  // find information for device
  let deviceInfo = devicesInfo.filter(d => d.id === deviceConfiguredSubset[0].deviceConfig.deviceId); // should only be one, if any
  if (helper_app.isEmpty(deviceInfo))
    return undefined;

  return deviceInfo;
};

/**
 * Takes application configuration and property name to return configured values
 * @param {dictonary} configuration - Configured settings for application
 * @param {string} name - Name of property to match on
 * @return {arrary} values contained in configuration
 **/
const stringValuesConfigured = (configuration, name) => {
  let values = [];

  // list of devices included in property
  appConfigProperty(configuration, name).forEach(element => {
    if (typeof(element.valueType) !== 'undefined' && element.valueType.toLowerCase() === 'string') {  // check for correct type
      values.push(element.stringConfig.value);
    }
  });

  return values;
};

const self = module.exports = {
  signatureIsVerified,
  appConfigProperty,
  devicesConfigured,
  devicesUnique,
  devicesSubsetInfo,
  devicesConfigContainedIn,
  stringValuesConfigured
};
