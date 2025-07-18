const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const passport = require('passport');

// Create a new report
router.post('/', passport.authenticate('jwt', { session: false }), reportController.createReport);

// Get all reports
router.get('/', reportController.getAllReports);

// Get a report by ID
router.get('/:id', reportController.getReportById);

// Delete a report
router.delete('/:id', reportController.deleteReport);

module.exports = router;
