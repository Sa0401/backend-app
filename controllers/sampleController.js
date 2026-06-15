const Sample = require('../models/Sample');

// @desc    Get all samples
// @route   GET /api/samples
// @access  Public
exports.getSamples = async (req, res) => {
  try {
    const { type } = req.query;
    let query = {};
    if (type) {
      query.type = type;
    }
    const samples = await Sample.find(query).sort({ createdAt: -1 });
    res.status(200).json(samples);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create new sample
// @route   POST /api/samples
// @access  Public
exports.createSample = async (req, res) => {
  try {
    const { type, imageUrl, title, description } = req.body;

    if (!type || !imageUrl || !title) {
      return res.status(400).json({ message: 'Please provide type, imageUrl, and title' });
    }

    const sample = await Sample.create({
      type,
      imageUrl,
      title,
      description
    });

    res.status(201).json(sample);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update sample
// @route   PUT /api/samples/:id
// @access  Public
exports.updateSample = async (req, res) => {
  try {
    const { imageUrl, title, description, type } = req.body;

    let sample = await Sample.findById(req.params.id);
    if (!sample) {
      return res.status(404).json({ message: 'Sample not found' });
    }

    sample.imageUrl = imageUrl || sample.imageUrl;
    sample.title = title || sample.title;
    sample.description = description !== undefined ? description : sample.description;
    sample.type = type || sample.type;

    const updatedSample = await sample.save();
    res.status(200).json(updatedSample);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete sample
// @route   DELETE /api/samples/:id
// @access  Public
exports.deleteSample = async (req, res) => {
  try {
    const sample = await Sample.findById(req.params.id);
    if (!sample) {
      return res.status(404).json({ message: 'Sample not found' });
    }

    await sample.deleteOne();
    res.status(200).json({ message: 'Sample deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
