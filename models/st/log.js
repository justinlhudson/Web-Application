const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const LogSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  value: {
    type: String,
    required: true
  },
  created: {
    type: Date,
    default: Date.now
  }
});

// Massage data prior to injection
LogSchema.pre('save', function(next) {
  const log = this;
//  logHandler.value = override
  return next();
});

// Use the schema to register a model with MongoDb
const Log = mongoose.model('Log', LogSchema);