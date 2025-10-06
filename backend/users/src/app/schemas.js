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
    username: { type: 'string', minLength: 3, maxLength: 20, pattern: '^[a-zA-Z0-9_]+$' },
    password: { type: 'string', minLength: 6, maxLength: 100, pattern: '^[a-zA-Z0-9_!@#$%^&*()-+=]+$' }
  },
  required: ['username', 'password'],
  additionalProperties: false
};

const profileParamSchema = {
  type: 'object',
  properties: {
    display_name: { type: 'string', minLength: 3, maxLength: 20, pattern: '^[a-zA-Z0-9_ ]+$' },
    avatar_url: { type: 'string', format: 'uri' },
    bio: { type: 'string', maxLength: 160 }
  },
  additionalProperties: false
};

const userResponseKeys = [
  'id',
  'username',
  'created_at'
]

const profileResponseKeys = [
  'username',
  'display_name',
  'avatar_url',
  'bio',
  'created_at',
  'friends',
  'stats'
]

module.exports = { JSONError, usernameAndPasswordSchema, profileParamSchema, userResponseKeys, profileResponseKeys };