const mongoose = require('mongoose');

const sampleSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: [true, 'Sample type is required'],
      enum: ['gallery', 'aari'],
    },
    imageUrl: {
      type: String,
      required: [true, 'Image URL is required'],
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const mongooseModel = mongoose.model('Sample', sampleSchema);

module.exports = new Proxy(mongooseModel, {
  get: function (target, prop) {
    const activeModel = process.env.USE_JSON_DB === 'true' 
      ? require('../config/jsonDb').Sample 
      : mongooseModel;
    
    const value = activeModel[prop];
    if (typeof value === 'function') {
      return value.bind(activeModel);
    }
    return value;
  },
  construct: function(target, argumentsList) {
    const activeModel = process.env.USE_JSON_DB === 'true'
      ? require('../config/jsonDb').Sample
      : mongooseModel;
      
    if (process.env.USE_JSON_DB === 'true') {
      return activeModel.construct(...argumentsList);
    }
    return new activeModel(...argumentsList);
  }
});
