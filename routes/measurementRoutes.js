const express = require('express');
const router = express.Router();
const {
  getMeasurements,
  getMeasurementById,
  createMeasurement,
  updateMeasurement,
  deleteMeasurement,
} = require('../controllers/measurementController');

router.route('/')
  .get(getMeasurements)
  .post(createMeasurement);

router.route('/:id')
  .get(getMeasurementById)
  .put(updateMeasurement)
  .delete(deleteMeasurement);

module.exports = router;
