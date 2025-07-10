const Report = require('../models/report.model');
const Post = require('../models/post.model');

// Create a new report
exports.createReport = async (req, res) => {
  try {
    const { post, reportReason } = req.body;
    if (!post || !reportReason) {
      return res.status(400).json({ error: 'Post and report reason are required.' });
    }
    // Prevent duplicate reports by the same user for the same post
    let report = await Report.findOne({ post });
    if (report) {
      // Add user to reportedBy if not already present
      if (!report.reportedBy.includes(req.user._id)) {
        report.reportedBy.push(req.user._id);
        await report.save();
      }
      return res.status(200).json(report);
    }
    report = new Report({
      post,
      reportedBy: [req.user._id],
      reportReason
    });
    await report.save();
    res.status(201).json(report);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create report.' });
  }
};

// Get all reports
exports.getAllReports = async (req, res) => {
  try {
    const reports = await Report.find().populate('post reportedBy');
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reports.' });
  }
};

// Get a report by ID
exports.getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id).populate('post reportedBy');
    if (!report) return res.status(404).json({ error: 'Report not found.' });
    res.json(report);
  } catch (err) {
    res.status(400).json({ error: 'Invalid report ID.' });
  }
};

// Delete a report
exports.deleteReport = async (req, res) => {
  try {
    await Report.findByIdAndDelete(req.params.id);
    res.json({ message: 'Report deleted.' });
  } catch (err) {
    res.status(400).json({ error: 'Failed to delete report.' });
  }
}; 