const mongoose = require('mongoose');

const measurementSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer link is required'],
    },
    garmentType: {
      type: String,
      required: [true, 'Garment type is required'],
      enum: ['Shirt', 'Pants', 'Suit', 'Dress', 'Kurta', 'Other'],
      default: 'Shirt',
    },
    title: {
      type: String,
      trim: true,
      default: 'Standard Measurement',
    },
    // Standard measurements in inches or cm
    neck: { type: Number, default: 0 },
    chest: { type: Number, default: 0 },
    waist: { type: Number, default: 0 },
    hips: { type: Number, default: 0 },
    shoulder: { type: Number, default: 0 },
    sleeveLength: { type: Number, default: 0 },
    armhole: { type: Number, default: 0 },
    fullLength: { type: Number, default: 0 },
    inseam: { type: Number, default: 0 },
    pantsLength: { type: Number, default: 0 },
    thigh: { type: Number, default: 0 },
    cuff: { type: Number, default: 0 },
    collar: { type: Number, default: 0 },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const mongooseModel = mongoose.model('Measurement', measurementSchema);

module.exports = new Proxy(mongooseModel, {
  get: function (target, prop) {
    const activeModel = process.env.USE_JSON_DB === 'true' 
      ? require('../config/jsonDb').Measurement 
      : mongooseModel;
    
    const value = activeModel[prop];
    if (typeof value === 'function') {
      return value.bind(activeModel);
    }
    return value;
  },
  construct: function(target, argumentsList) {
    const activeModel = process.env.USE_JSON_DB === 'true'
      ? require('../config/jsonDb').Measurement
      : mongooseModel;
      
    if (process.env.USE_JSON_DB === 'true') {
      return activeModel.construct(...argumentsList);
    }
    return new activeModel(...argumentsList);
  }
});
