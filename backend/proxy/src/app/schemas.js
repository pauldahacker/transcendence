function JSONError(message, statusCode, code) {
  const result = {};
  if (statusCode !== undefined) result.status = String(statusCode);
  if (code !== undefined) result.code = code;
  if (message !== undefined) result.detail = message;
  return result;
}

module.exports = { JSONError };