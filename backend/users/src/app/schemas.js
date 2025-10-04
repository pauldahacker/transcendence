function JSONError(message, statusCode, code) {
  const result = {};
  if (statusCode !== undefined) result.status = String(statusCode);
  if (code !== undefined) result.code = code;
  if (message !== undefined) result.detail = message;
  return result;
}

const usernameAndPasswordSchema = {
  type: 'object',
  properties: {
    username: { type: 'string' },
    password: { type: 'string' }
  },
  required: ['username', 'password']
};

module.exports = { JSONError, usernameAndPasswordSchema };