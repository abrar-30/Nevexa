
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { upload } = require('../middleware/cloudinary.middleware');
const { validate, registerSchema } = require('../middleware/validate');

router.post('/register', upload.single('avatar'), validate(registerSchema), authController.register);

router.post('/login', authController.login);

router.post('/logout', authController.logout);

// Password reset, email verification, etc. can be added here

module.exports = router;
