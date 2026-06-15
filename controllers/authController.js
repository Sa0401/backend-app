const User = require('../models/User');
const Customer = require('../models/Customer');
const crypto = require('crypto');

// Helper to hash password using PBKDF2
const hashPassword = (password, salt) => {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, phone, email, password } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({ message: 'Please provide name, phone, and password' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ phone });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this phone number' });
    }

    // Check if customer already exists with this phone number
    let customer = await Customer.findOne({ phone });
    
    if (customer) {
      // Customer exists, link User to this customer
      // Update email if it's set in registration but not in customer profile
      if (email && !customer.email) {
        customer.email = email;
        await customer.save();
      }
    } else {
      // Customer doesn't exist, create a new customer profile
      customer = await Customer.create({
        name,
        phone,
        email: email || '',
        notes: 'Created via online sign up.'
      });
    }

    // Generate salt and password hash
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(password, salt);

    // Create User
    const user = await User.create({
      name,
      phone,
      email: email || '',
      passwordHash,
      salt,
      role: 'customer',
      customerId: customer._id
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role,
      customerId: user.customerId
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Authenticate user & get token info
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ message: 'Please provide phone number and password' });
    }

    // Support default admin login credentials
    if (phone === 'admin' && password === 'admin123') {
      return res.status(200).json({
        _id: 'admin_user',
        name: 'Aruna',
        phone: 'admin',
        role: 'admin'
      });
    }

    // Find user by phone
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(400).json({ message: 'Invalid phone number or password' });
    }

    // Verify password
    const loginHash = hashPassword(password, user.salt);
    if (loginHash !== user.passwordHash) {
      return res.status(400).json({ message: 'Invalid phone number or password' });
    }

    res.status(200).json({
      _id: user._id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role,
      customerId: user.customerId
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
