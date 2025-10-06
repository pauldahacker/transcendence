function JSONError(message, statusCode, code) {
  const result = {};
  if (statusCode !== undefined) result.status = String(statusCode);
  if (code !== undefined) result.code = code;
  if (message !== undefined) result.detail = message;
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