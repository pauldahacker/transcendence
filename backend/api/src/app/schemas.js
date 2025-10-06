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

module.exports = { JSONError, adminPasswordSchema };