const Joi = require('joi');

// Joi schemas
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  // avatar is optional (file upload)
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
  registerSchema
}; 