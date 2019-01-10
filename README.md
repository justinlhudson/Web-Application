# Web-Application

One stop shop for all things [Node.js](https://nodejs.org) related work...

*Details are missing, but the project should be self-explanatory (under-work). :no_mouth:*

## SmartThings ([SmartApp](https://smartthings.developer.samsung.com/docs/guides/smartapps/basics.html))

At the very least this is to help give more examples on how to use the [SmartThings ecosystem](https://smartthings.developer.samsung.com/develop/index.html).

### Quick Setup

#### Prerequisites

- Create your environment variables in `environment.json`
  - _This file is ignored by git to protect secrets_
  - In `configuration/`, copy the file `environment.example.json` and rename to `environment.json`
    - Shell command: `cp configuration/environment.example.json environment.json`
- [MongoDB](https://mongodb.com)
  - Install MongoDB globally
    - [macOS](https://treehouse.github.io/installation-guides/mac/mongo-mac.html): `brew install mongodb`
  - **Remember:** you can run the database with the `npm` script: `npm run start-db`
- [Ngrok](https://ngrok.com/)
  - Enter your auth token to allow custom domains. If you have Ngrok installed and configured, you may find the auth token in your configuration file at `~/.ngrok2/ngrok.yml`
  - Ensure no other instances are running - see [potential startup issues](#troubleshooting)
- [OpenWeatherMap](https://openweathermap.org/api)
  - Add your API key to `configuration/environment.json`~`ST.WEATHER_API_KEY`
- [SmartThings Developer Workspace](https://devworkspace.developer.samsung.com/smartthingsconsole/iotweb/site/#/app/develop)
  - Create an Automation
    - Apply appropriate permission scopes
      - **NOTE**: if you have ran this application prior to December 2018, you will need to remove references to deprecated permissions, such as `schedules`, which are no longer required. Automation apps created after this period will not be allowed to use those scopes but your code may still reference it.
    - Enter your webhook URL from the console output (should end with path `/st` so the `POST` requests can be routed to the SmartThings request handler)
    - Before saving, run the app (see [Run](#run) below) so the app can respond to **PING** lifecycle requests.
    - Upon successful saving, copy and paste the values into your app:
      - Public key -> `controllers/st/data/smartthings_rsa.pub`
      - Client ID -> `configuration/environment.json`~`ST.CLIENT_ID`
      - Client Secret -> `configuration/environment.json`~`ST.CLIENT_SECRET`

#### Run the app

- Ensure your MongoDB instance is running
  - Dev: `npm run start-db`
- Start the application
  - Dev: `node server.js`, or `npm start`
  - Daemon: `pm2 start ./pm2.config.js`

### Business logic

`./controllers/st/*`

#### Features

- Weather Light Indicator:
  - `./controllers/st/weatherlight.js`
- Security System (self-monitored by email/text):
  - `./controllers/st/security.js`
- Logger (store device states to [MongoDB](https://www.mongodb.com/)):
  - `./controllers/st/logger.js`
- Changes (armed/disarmed de/activations):
  - `./controllers/st/changes.js`

### Troubleshooting

#### When starting the app, I see "Error: connect ECONNREFUSED 127.0.0.1:4041"

You may already have an instance of Ngrok running somewhere else. This error will happen because each instance starts a web inspector at `localhost:4040`. You can **A)** shut down that instance, or **B)**, disable the inspector by configuring the option in code:

`server.js`:

```javascript
ngrok.connect({ inspect: false })
```

#### I receive a cryptic failure when configuring this automation in the mobile app

Using the Developer Workspace tool [Live Logging](https://devworkspace.developer.samsung.com/smartthingsconsole/iotweb/site/#/app/tools/logger/automation), you can see all events flowing into your instance -- including errors that are never bubbled up to the mobile app's user interface.

> **NOTE:** You will only be able to see your own account's events for security purposes

Example event including a potential error:

```json
INSTALLED_APP_LIFECYCLE_EVENT
{"eventTime":1547063745012,"eventType":"INSTALLED_APP_LIFECYCLE_EVENT","installedAppLifecycleEvent":{"locationId":"SOMEUUID","installedAppId":"SOMEUUID","appId":"SOMEUUID","lifecycle":"OTHER","other":{},"error":{"code":"ConstraintViolationError","message":"The request is malformed.","target":"","details":[{"code":"UnsupportedPermissionRequestedError","message":"The requested permission is not supported by the backing App's OAuth Client.","target":"config.app.configEntry.permissionConfig.permission(r:schedules)","details":[]},{"code":"UnsupportedPermissionRequestedError","message":"The requested permission is not supported by the backing App's OAuth Client.","target":"config.app.configEntry.permissionConfig.permission(w:schedules)","details":[]}]}}}
```

### Acknowledgement

[SmartThingsCommunity/weather-color-light-smartapp-nodejs](https://github.com/SmartThingsCommunity/weather-color-light-smartapp-nodejs)
