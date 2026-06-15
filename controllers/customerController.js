const Customer = require('../models/Customer');
const Measurement = require('../models/Measurement');
const Order = require('../models/Order');

// @desc    Get all customers
// @route   GET /api/customers
// @access  Public
exports.getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().sort({ name: 1 });
    res.status(200).json(customers);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single customer details (including measurements and orders)
// @route   GET /api/customers/:id
// @access  Public
exports.getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Fetch associated measurements and orders
    const measurements = await Measurement.find({ customer: customer._id }).sort({ updatedAt: -1 });
    const orders = await Order.find({ customer: customer._id }).sort({ orderDate: -1 });

    res.status(200).json({
      customer,
      measurements,
      orders,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create new customer
// @route   POST /api/customers
// @access  Public
exports.createCustomer = async (req, res) => {
  try {
    const { name, phone, email, address, notes } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ message: 'Please provide name and phone number' });
    }

    const customer = await Customer.create({
      name,
      phone,
      email,
      address,
      notes,
    });

    res.status(201).json(customer);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Public
exports.updateCustomer = async (req, res) => {
  try {
    const { name, phone, email, address, notes } = req.body;

    let customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    customer.name = name || customer.name;
    customer.phone = phone || customer.phone;
    customer.email = email !== undefined ? email : customer.email;
    customer.address = address !== undefined ? address : customer.address;
    customer.notes = notes !== undefined ? notes : customer.notes;

    const updatedCustomer = await customer.save();
    res.status(200).json(updatedCustomer);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete customer
// @route   DELETE /api/customers/:id
// @access  Public
exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Delete associated measurements and orders as well (cascade delete)
    await Measurement.deleteMany({ customer: customer._id });
    await Order.deleteMany({ customer: customer._id });
    await customer.deleteOne();

    res.status(200).json({ message: 'Customer and all associated data deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
