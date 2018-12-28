# Web-Application

One stop shop for all things [Node.js](https://nodejs.org) related work...

*Details are missing, but the project should be self-explanatory (under-work). :no_mouth:*


## SmartThings ([SmartApp](https://smartthings.developer.samsung.com/docs/guides/smartapps/basics.html))

At the very least this is to help give more examples on how to use the [SmartThings Ecosystem](https://smartthings.developer.samsung.com/develop/index.html).

#### Quick Setup

##### Fill in the blanks for:
- [ngrok](https://ngrok.com/)
- [OpernWeatherMap](openweathermap.org)
- [SmartThings Authorization](https://account.smartthings.com/tokens)  
```
./configuration/environment.json
```

##### Run:

```nodejs server.js```
or
```pm2 start ./pm2.config.js```

#### Business logic

```./controllers/st/*```

##### Features
- Weather Light Indicator:
```./controllers/st/weatherlight.js```
- Security System (self-monitored by email/text):
```./controllers/st/security.js```
- Logger (store device states to [MongoDB](https://www.mongodb.com/)):
```./controllers/st/logger.js```
- Changes (armed/disarmed de/activations):
```./controllers/st/changes.js```

#### Acknowledgement

[SmartThingsCommunity/weather-color-light-smartapp-nodejs](https://github.com/SmartThingsCommunity/weather-color-light-smartapp-nodejs)
