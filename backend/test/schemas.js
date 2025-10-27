function JSONError(message, statusCode, error) {
  const result = {};
  if (error !== undefined) result.error = error;
  if (message !== undefined) result.message = message;
  if (statusCode !== undefined) result.statusCode = statusCode;
  return result;
}

const usernameAndPasswordSchema = {
  type: 'object',
  properties: {
    username: { 
      type: 'string', 
      minLength: 3, 
      maxLength: 20, 
      pattern: '^[a-zA-Z0-9_]+$',
      not: { const: 'admin' }
    },
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

const matchResultSchema = {
  type: 'object',
  properties: {
    tournament_id: { type: 'number' },
    match_id: { type: 'number' },
    match_date: { type: 'string', format: 'date-time' },
    a_participant_id: { type: 'number' },
    b_participant_id: { type: 'number' },
    a_participant_score: { type: 'number' },
    b_participant_score: { type: 'number' },
    winner_id: { type: 'number' },
    loser_id: { type: 'number' }
  },
  required: ['tournament_id', 'match_id', 'match_date', 'a_participant_id', 'b_participant_id', 'a_participant_score', 'b_participant_score', 'winner_id', 'loser_id'],
  additionalProperties: false
};

const userResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'number' },
    username: { type: 'string' },
    created_at: { type: 'string', format: 'date-time' }
  },
  required: ['id', 'username', 'created_at'],
  additionalProperties: false
};

const profileResponseSchema = {
  type: 'object',
  properties: {
    username: { type: 'string' },
    display_name: { type: 'string' },
    avatar_url: { type: 'string', format: 'uri' },
    bio: { type: 'string' },
    created_at: { type: 'string', format: 'date-time' },
    is_active: { type: 'boolean' }
  },
  required: ['username', 'display_name', 'avatar_url', 'bio', 'created_at', 'is_active'],
  additionalProperties: false
};

const friendsResponseSchema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      id: { type: 'number' },
      username: { type: 'string' },
      display_name: { type: 'string' },
      avatar_url: { type: 'string', format: 'uri' },
      confirmed: { type: 'boolean' },
      requested_by_id: { type: 'number' }
    },
    required: ['id', 'username', 'display_name', 'avatar_url', 'confirmed', 'requested_by_id'],
    additionalProperties: false
  }
};

const statsResponseSchema = {
  type: 'object',
  properties: {
    total_matches: { type: 'number' },
    wins: { type: 'number' },
    losses: { type: 'number' },
  },
  required: ['total_matches', 'wins', 'losses'],
  additionalProperties: false
};

const matchHistoryResponseSchema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      tournament_id: { type: 'number' },
      match_id: { type: 'number' },
      match_date: { type: 'string', format: 'date-time' },
      opponent_username: { type: 'string' },
      user_score: { type: 'number' },
      opponent_score: { type: 'number' },
      result: { type: 'string', enum: ['win', 'loss'] }
    },
    required: ['tournament_id', 'match_id', 'match_date', 'opponent_username', 'user_score', 'opponent_score', 'result'],
    additionalProperties: false
  }
};

module.exports = {
  JSONError,
  usernameAndPasswordSchema,
  profileParamSchema,
  matchResultSchema,
  userResponseSchema,
  profileResponseSchema,
  friendsResponseSchema,
  statsResponseSchema,
  matchHistoryResponseSchema
};