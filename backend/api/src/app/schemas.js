function JSONError(message, statusCode, error) {
  const result = {};
  if (error !== undefined) result.error = error;
  if (message !== undefined) result.message = message;
  if (statusCode !== undefined) result.statusCode = statusCode;
  return result;
}

const adminPasswordSchema = {
  type: 'object',
  required: ['admin_password'],
  properties: {
    admin_password: { type: 'string', minLength: 5 },
  },
};

const userSchema = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    username: { type: 'string' },
    created_at: { type: 'string', format: 'date-time' },
  },
};

module.exports = { JSONError, adminPasswordSchema, userSchema };