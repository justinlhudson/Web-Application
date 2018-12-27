const rp = require('request-promise');
const mongoose = require('mongoose');
const environment = require('./configuration/environment.json');
const fsWrapper = require('./helpers/fsExtension');

const connection = mongoose.connection;
mongoose.Promise = global.Promise

connection.on('error', function(err) {
  console.error(err);
});

mongoose.connect(environment.MONGO.CONNECTION, { useNewUrlParser: true});

// Note: Can register schemas before connection is made
// auto load models based on folders (e.g. much like routing)
const list = [];
fsWrapper.getAllFilesFromFolderSync(__dirname + '/models', (err, results) => {
  if (err) {
    throw err;
  }

  _.forEach(results, function(path) {
    list.push(path);
    require(`./${path}`); // magic to register schemas
  });
});

if (list.length > 0) {
  //console.log(`model(s): ${list}`);
}

exports.connection = connection;