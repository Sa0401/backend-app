const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  garmentType: {
    type: String,
    required: true,
    enum: ['Shirt', 'Pants', 'Suit', 'Dress', 'Kurta', 'Other'],
  },
  quantity: {
    type: Number,
    required: true,
    default: 1,
  },
  price: {
    type: Number,
    required: true,
    default: 0,
  },
  measurementUsed: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Measurement',
  },
  notes: {
    type: String,
    trim: true,
  },
});

const orderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer is required'],
    },
    orderNumber: {
      type: String,
      unique: true,
    },
    items: [orderItemSchema],
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      default: 0,
    },
    advanceAmount: {
      type: Number,
      default: 0,
    },
    balanceAmount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Ready', 'Delivered', 'Cancelled'],
      default: 'Pending',
    },
    paymentStatus: {
      type: String,
      enum: ['Unpaid', 'Partially Paid', 'Fully Paid'],
      default: 'Unpaid',
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Card', 'UPI'],
      default: 'Cash'
    },
    paymentRef: {
      type: String,
      trim: true
    },
    feedback: {
      type: String,
      trim: true
    },
    orderDate: {
      type: Date,
      default: Date.now,
    },
    deliveryDate: {
      type: Date,
      required: [true, 'Delivery date is required'],
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

// Pre-save hook to calculate fields and generate order number
orderSchema.pre('save', async function (next) {
  if (this.isNew && !this.orderNumber) {
    try {
      const count = await mongoose.model('Order').countDocuments();
      this.orderNumber = `ORD-${String(count + 1001).padStart(4, '0')}`;
    } catch (err) {
      return next(err);
    }
  }

  // Ensure balance and payment status are correct
  this.balanceAmount = this.totalAmount - this.advanceAmount;
  if (this.balanceAmount <= 0) {
    this.paymentStatus = 'Fully Paid';
  } else if (this.advanceAmount > 0) {
    this.paymentStatus = 'Partially Paid';
  } else {
    this.paymentStatus = 'Unpaid';
  }
  
  next();
});



const mongooseModel = mongoose.model('Order', orderSchema);

module.exports = new Proxy(mongooseModel, {
  get: function (target, prop) {
    const activeModel = process.env.USE_JSON_DB === 'true' 
      ? require('../config/jsonDb').Order 
      : mongooseModel;
    
    const value = activeModel[prop];
    if (typeof value === 'function') {
      return value.bind(activeModel);
    }
    return value;
  },
  construct: function(target, argumentsList) {
    const activeModel = process.env.USE_JSON_DB === 'true'
      ? require('../config/jsonDb').Order
      : mongooseModel;
      
    if (process.env.USE_JSON_DB === 'true') {
      return activeModel.construct(...argumentsList);
    }
    return new activeModel(...argumentsList);
  }
});
