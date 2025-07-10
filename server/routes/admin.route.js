const express = require("express");
const { isAdmin } = require("../middleware/isAdmin");
const adminController = require("../controllers/admin.controller");
const router = express.Router();


// Protect all routes with admin check
router.use(isAdmin);

//  Reports
router.get("/reports", adminController.getAllReports);
router.get("/reports/:reportId", adminController.getReportById);
router.put("/reports/:reportId/resolve", adminController.resolveReport);
router.delete("/reports/:reportId", adminController.deleteReport);

// Posts (Moderation + Management)
router.get("/posts", adminController.getAllPosts); 
router.get("/posts/:postId", adminController.getPostById); 
router.put("/posts/:postId", adminController.editPost); 
router.delete("/posts/:postId", adminController.deletePost);


// Comments
router.get("/comments", adminController.getAllComments); 
router.delete("/comments/:commentId", adminController.deleteComment);

// Users
router.get("/users", adminController.getAllUsers);
router.put("/users/:id/block", adminController.blockUser);
router.put("/users/:id/unblock", adminController.unblockUser);
router.put("/users/:id", adminController.editUserProfile); 
router.delete("/users/:id", adminController.deleteUser);

// get all reports
router.get("/reports", adminController.getAllReports);
router.get("/reports/:reportId", adminController.getReportById);
router.delete("/reports/:reportId", adminController.deleteReport);


module.exports = router;
