const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const sassMiddleware = require('node-sass-middleware');
const debug = require('debug')('web-application:app');
const http = require('http');
const https = require('https');
const bodyParser = require('body-parser');
const router = require('folder-router');  // routes based on directory name
const ngrok = require('ngrok');
const pem = require('pem');
const favicon = require('serve-favicon');

// prefix timestamp to console log
require('log-timestamp');

const helper = require.main.require('./helpers/helper');

const configuration = require('./configuration/environment.json');

require('./helpers/extensions') // load extensions to functions :)

global.__base = __dirname;
global._ = require('lodash').runInContext(); // legacy support Todo: use ES6 standard

const port = helper.normalizeInt(process.env.PORT || '3000');
const port_ssl = helper.normalizeInt(process.env.PORT || '3333');

// mongodb init. also register moongose schemas
let db;
try {
  db = require('./database');
} catch (ex) {
  console.error('error', "Mongodb :\n" + ex)
}

const app = express();

// middleware - ignore error if not icon is set yet
/*
ignoreFavicon = (req, res, next) => {
  if (req.originalUrl === '/favicon.ico') {
    res.sendStatus(204).json({nope: true});
  } else {
    next();
  }
}
app.use(ignoreFavicon);
*/

// router path'ing setup
router(app, path.join(__dirname, 'routes'));
app.use('/', router)

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

//app.use(bodyParser.json());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(sassMiddleware({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public'),
  indentedSyntax: true, // true = .sass and false = .scss
  sourceMap: true,
  sourceMap: true
}));
app.use(express.static(path.join(__dirname, 'public')));

// handles error message was getting...?
app.use(favicon(__dirname + '/public/images/favicon.ico'));

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  console.error(err)
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// initializeApp
const server = http.createServer(app);

// Listen on provided port, on all network interfaces.
server.listen(port);

server.on('error', (error) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // setup specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
});

server.on('listening', options => {
  const addr = server.address();
  const bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  console.info('Listening on: ' + bind);

  //secure tunnel service
  (async () => {
    await ngrok.disconnect('https://'+configuration.NGROK.SUBDOMAIN+'.ngrok.io');
    await ngrok.connect({
      proto: 'http',
      addr: port,
      authtoken: configuration.NGROK.TOKEN,
      subdomain: configuration.NGROK.SUBDOMAIN,
      region: 'us'
    })
      .then((url) => {
        console.info('Webhook at: ' + url);
    })
      .catch((err) => {
        console.error('Error while connecting Ngrok: ', err);
      });
  })();
});


// no worky?!
/*
pem.createCertificate({days:365, selfSigned: true}, function(err, keys) {
  if (err) {
    throw err;
  }

  const options = {
    key: keys.serviceKey, //fs.readFileSync('server.key'),
    cert: keys.certificate //fs.readFileSync('server.crt')
  };

  const server_ssl = https.createServer(options, app);
  server_ssl.listen(port_ssl);

  server_ssl.on('error', (error) => {
    if (error.syscall !== 'listen') {
      throw error;
    }

    // setup specific listen errors with friendly messages
    switch (error.code) {
      case 'EACCES':
        console.error(bind + ' requires elevated privileges');
        process.exit(1);
        break;
      case 'EADDRINUSE':
        console.error(bind + ' is already in use');
        process.exit(1);
        break;
      default:
        throw error;
    }
  });
  //return module.exports = app;
});
*/

/*
io.attach(httpServer);
io.attach(httpsServer);

// app wide
io.on('connection', function(client) {
  logger.logHandler('debug','socket.io: user connected');
  client.on('event', data => logger.logHandler('debug',`socket.io: event: ${data}`));
  client.on('disconnect', () => logger.logHandler('debug','socket.io: user disconnect'));
  return client.on('app', data => logger.logHandler('info', `(io)-> ${data}`));
});
*/

module.exports = server;
