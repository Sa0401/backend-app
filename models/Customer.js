const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    address: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const mongooseModel = mongoose.model('Customer', customerSchema);

module.exports = new Proxy(mongooseModel, {
  get: function (target, prop) {
    const activeModel = process.env.USE_JSON_DB === 'true' 
      ? require('../config/jsonDb').Customer 
      : mongooseModel;
    
    const value = activeModel[prop];
    if (typeof value === 'function') {
      return value.bind(activeModel);
    }
    return value;
  },
  construct: function(target, argumentsList) {
    const activeModel = process.env.USE_JSON_DB === 'true'
      ? require('../config/jsonDb').Customer
      : mongooseModel;
      
    if (process.env.USE_JSON_DB === 'true') {
      return activeModel.construct(...argumentsList);
    }
    return new activeModel(...argumentsList);
  }
});
