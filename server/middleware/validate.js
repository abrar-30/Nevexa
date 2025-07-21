const Joi = require('joi');

// Joi schemas
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  // avatar is optional (file upload)
});

const updateUserSchema = Joi.object({
  name: Joi.string().min(2).max(50).optional(),
  avatar: Joi.string().uri().optional().allow(''),
  location: Joi.string().max(100).optional().allow(''),
  bio: Joi.string().max(500).optional().allow(''),
  interests: Joi.string().max(200).optional().allow(''),
});

// Validation middleware
const validate = (schema, property = 'body') => (req, res, next) => {
  const { error } = schema.validate(req[property]);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

module.exports = {
  validate,
  registerSchema,
  updateUserSchema
};