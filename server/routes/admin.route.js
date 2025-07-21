const express = require("express");
const { isAdmin } = require("../middleware/isAdmin");
const adminController = require("../controllers/admin.controller");
const passport = require('passport');
const router = express.Router();


// Check admin status endpoint (only requires JWT auth, not admin role)
router.get("/check", passport.authenticate('jwt', { session: false }), (req, res) => {
  const isUserAdmin = req.user && req.user.role === "admin";
  res.json({ isAdmin: isUserAdmin, user: req.user });
});

// Protect all other routes with JWT authentication first, then admin check
router.use(passport.authenticate('jwt', { session: false }));
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
router.put("/users/:id/promote", adminController.promoteToAdmin);
router.put("/users/:id/demote", adminController.demoteFromAdmin);
router.put("/users/:id", adminController.editUserProfile);
router.delete("/users/:id", adminController.deleteUser);


module.exports = router;
