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
  required: ['username', 'password'],
  additionalProperties: false
};

const profileParamSchema = {
  type: 'object',
  properties: {
    display_name: { type: 'string' },
    avatar_url: { type: 'string' },
    bio: { type: 'string' }
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