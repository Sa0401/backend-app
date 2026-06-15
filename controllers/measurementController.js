const Measurement = require('../models/Measurement');
const Customer = require('../models/Customer');

// @desc    Get all measurements or filter by customer ID
// @route   GET /api/measurements
// @access  Public
exports.getMeasurements = async (req, res) => {
  try {
    const { customer } = req.query;
    let query = {};
    
    if (customer) {
      query.customer = customer;
    }

    const measurements = await Measurement.find(query)
      .populate('customer', 'name phone')
      .sort({ updatedAt: -1 });

    res.status(200).json(measurements);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single measurement
// @route   GET /api/measurements/:id
// @access  Public
exports.getMeasurementById = async (req, res) => {
  try {
    const measurement = await Measurement.findById(req.params.id).populate('customer', 'name phone');
    if (!measurement) {
      return res.status(404).json({ message: 'Measurement record not found' });
    }
    res.status(200).json(measurement);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create new measurement
// @route   POST /api/measurements
// @access  Public
exports.createMeasurement = async (req, res) => {
  try {
    const {
      customer,
      garmentType,
      title,
      neck,
      chest,
      waist,
      hips,
      shoulder,
      sleeveLength,
      armhole,
      fullLength,
      inseam,
      pantsLength,
      thigh,
      cuff,
      collar,
      notes,
    } = req.body;

    if (!customer || !garmentType) {
      return res.status(400).json({ message: 'Please provide customer ID and garment type' });
    }

    // Verify customer exists
    const customerExists = await Customer.findById(customer);
    if (!customerExists) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const measurement = await Measurement.create({
      customer,
      garmentType,
      title: title || `${garmentType} Measurement`,
      neck,
      chest,
      waist,
      hips,
      shoulder,
      sleeveLength,
      armhole,
      fullLength,
      inseam,
      pantsLength,
      thigh,
      cuff,
      collar,
      notes,
    });

    res.status(201).json(measurement);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update measurement
// @route   PUT /api/measurements/:id
// @access  Public
exports.updateMeasurement = async (req, res) => {
  try {
    let measurement = await Measurement.findById(req.params.id);
    if (!measurement) {
      return res.status(404).json({ message: 'Measurement record not found' });
    }

    // Fields to update
    const fieldsToUpdate = [
      'garmentType',
      'title',
      'neck',
      'chest',
      'waist',
      'hips',
      'shoulder',
      'sleeveLength',
      'armhole',
      'fullLength',
      'inseam',
      'pantsLength',
      'thigh',
      'cuff',
      'collar',
      'notes',
    ];

    fieldsToUpdate.forEach((field) => {
      if (req.body[field] !== undefined) {
        measurement[field] = req.body[field];
      }
    });

    const updatedMeasurement = await measurement.save();
    res.status(200).json(updatedMeasurement);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete measurement
// @route   DELETE /api/measurements/:id
// @access  Public
exports.deleteMeasurement = async (req, res) => {
  try {
    const measurement = await Measurement.findById(req.params.id);
    if (!measurement) {
      return res.status(404).json({ message: 'Measurement record not found' });
    }

    await measurement.deleteOne();
    res.status(200).json({ message: 'Measurement record deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
