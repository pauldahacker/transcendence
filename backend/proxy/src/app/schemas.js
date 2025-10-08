function JSONError(message, statusCode, code) {
  const result = {};
  if (statusCode !== undefined) result.status = String(statusCode);
  if (code !== undefined) result.code = code;
  if (message !== undefined) result.detail = message;
  return result;
}

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

module.exports = { JSONError, userResponseKeys, profileResponseKeys };