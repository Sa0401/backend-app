const Order = require('../models/Order');
const Customer = require('../models/Customer');

// @desc    Get all orders (optionally filter by customer)
// @route   GET /api/orders
// @access  Public
exports.getOrders = async (req, res) => {
  try {
    const { customer, status } = req.query;
    let query = {};

    if (customer) {
      query.customer = customer;
    }
    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate('customer', 'name phone')
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Public
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name phone address email')
      .populate({
        path: 'items.measurementUsed',
        model: 'Measurement',
      });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Public
exports.createOrder = async (req, res) => {
  try {
    const {
      customer,
      items,
      totalAmount,
      advanceAmount,
      deliveryDate,
      notes,
      paymentMethod,
      paymentRef,
      feedback,
    } = req.body;

    if (!customer || !items || !items.length || totalAmount === undefined || !deliveryDate) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Verify customer exists
    const customerExists = await Customer.findById(customer);
    if (!customerExists) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Use .create() which works for both MongoDB and JSON DB
    const order = await Order.create({
      customer,
      items,
      totalAmount,
      advanceAmount: advanceAmount || 0,
      deliveryDate,
      notes,
      paymentMethod: paymentMethod || 'Cash',
      paymentRef,
      feedback,
    });

    // Populate customer details for response
    const populatedOrder = await Order.findById(order._id).populate('customer', 'name phone');

    res.status(201).json(populatedOrder);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update order
// @route   PUT /api/orders/:id
// @access  Public
exports.updateOrder = async (req, res) => {
  try {
    const {
      status,
      items,
      totalAmount,
      advanceAmount,
      deliveryDate,
      notes,
      paymentMethod,
      paymentRef,
      feedback,
    } = req.body;

    let order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (status !== undefined) order.status = status;
    if (items !== undefined) order.items = items;
    if (totalAmount !== undefined) order.totalAmount = totalAmount;
    if (advanceAmount !== undefined) order.advanceAmount = advanceAmount;
    if (deliveryDate !== undefined) order.deliveryDate = deliveryDate;
    if (notes !== undefined) order.notes = notes;
    if (paymentMethod !== undefined) order.paymentMethod = paymentMethod;
    if (paymentRef !== undefined) order.paymentRef = paymentRef;
    if (feedback !== undefined) order.feedback = feedback;

    await order.save(); // pre-save hook handles recalculating balance and payment status

    const updatedOrder = await Order.findById(order._id)
      .populate('customer', 'name phone')
      .populate('items.measurementUsed');
      
    res.status(200).json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete order
// @route   DELETE /api/orders/:id
// @access  Public
exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    await order.deleteOne();
    res.status(200).json({ message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
