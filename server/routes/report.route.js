const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { isAuthenticated } = require('../middleware/auth.middleware');

// Create a new report
router.post('/', isAuthenticated, reportController.createReport);

// Get all reports
router.get('/', reportController.getAllReports);

// Get a report by ID
router.get('/:id', reportController.getReportById);

// Delete a report
router.delete('/:id', reportController.deleteReport);

module.exports = router;
