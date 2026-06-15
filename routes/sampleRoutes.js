const express = require('express');
const router = express.Router();
const {
  getSamples,
  createSample,
  updateSample,
  deleteSample
} = require('../controllers/sampleController');

router.route('/')
  .get(getSamples)
  .post(createSample);

router.route('/:id')
  .put(updateSample)
  .delete(deleteSample);

module.exports = router;
