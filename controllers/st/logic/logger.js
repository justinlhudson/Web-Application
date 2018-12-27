const rp = require('request-promise');
const mongoose = require('mongoose');

const Log = mongoose.model('Log');

const add = (params) => {
  const item = new Log({
    name: params.name,
    type: params.type,
    value: params.value
  });

  return new Promise( (resolve, reject) => {
    item.save()
      .then(function (doc) {
        resolve(doc)
      })
      .catch(function (err) {
        reject(err)
      });
  });
};

const collection = (name = '') => {
  return new Promise( (resolve, reject) => {
    if (name === '') {
      Log.find({}, {}, function (err, docs) {
        if (err) {
          reject(err);
        }
        resolve(docs);
      });
    } else {
      Log.find({'name': name}, {}, function (err, docs) {
        if (err) {
          reject(err);
        }
        resolve(docs);
      });
    }
  });
};

module.exports = {
  add,
  collection
};