const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    salt: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'customer'],
      default: 'customer',
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
    },
  },
  {
    timestamps: true,
  }
);

const mongooseModel = mongoose.model('User', userSchema);

module.exports = new Proxy(mongooseModel, {
  get: function (target, prop) {
    const activeModel = process.env.USE_JSON_DB === 'true' 
      ? require('../config/jsonDb').User 
      : mongooseModel;
    
    const value = activeModel[prop];
    if (typeof value === 'function') {
      return value.bind(activeModel);
    }
    return value;
  },
  construct: function(target, argumentsList) {
    const activeModel = process.env.USE_JSON_DB === 'true'
      ? require('../config/jsonDb').User
      : mongooseModel;
      
    if (process.env.USE_JSON_DB === 'true') {
      return activeModel.construct(...argumentsList);
    }
    return new activeModel(...argumentsList);
  }
});
