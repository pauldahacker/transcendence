# API endpoints

> [!TIP]
> All endpoints except `/api/users/register` and `/api/users/login` require authentication via JWT in the `Authorization` header as `Bearer {token}`. Such token is obtained upon successful login.

> [!TIP]
> For frontend integration, the base URL to use is `https://api:3000/`.

## User endpoints

### Endpoint: `POST   /api/users/register`

Request body:
```json
{
  "username": "string",
  "password": "string"
}
```
Response body:
```json
{
  "id": "number",
  "username": "string",
  "created_at": "string"
}
```
Error responses:
- `409`: Username already exists

### Endpoint: `POST   /api/users/login`

Request body:
```json
{
  "username": "string",
  "password": "string"
}
```
Response body:
```json
{
  "token": "string"
}
```
Error responses:
- `401`: Password not valid
- `404`: User not found

### Endpoint: `POST   /api/users/logout`

Response body:
```json
{
  "message": "Logged out successfully"
}
```
Error responses:
- `401`: Invalid token header

### Endpoint: `GET    /api/users/`

Response body:
```json
[
  {
    "id": "number",
    "username": "string"
  }
]
```
Error responses:
- `401`: Invalid token header

### Endpoint: `GET    /api/users/{user_id}/`

Response body:
```json
{
  "username": "string",
  "display_name": "string",
  "avatar_url": "string",
  "bio": "string",
  "created_at": "string",
  "friends": [ "number" ],
  "stats": {
    "total_games": "number",
    "wins": "number",
    "losses": "number",
  }
}
```
Error responses:
- `401`: Invalid token header
- `404`: User not found

### Endpoint: `PUT    /api/users/{user_id}/`

Request body:
```json
{
  "display_name": "string",
  "avatar_url": "string",
  "bio": "string"
}
```
Response body:
```json
{
  "username": "string",
  "display_name": "string",
  "avatar_url": "string",
  "bio": "string",
  "created_at": "string",
  "friends": [ "number" ],
  "stats": {
    "total_games": "number",
    "wins": "number",
    "losses": "number",
  }
}
```
Error responses:
- `401`: Invalid token header
- `404`: User not found
- `403`: User not authorized

## Tournament endpoints



<!-- 


```
POST   /api/tournaments
GET    /api/tournaments
GET    /api/tournaments/{tournamentId}
PUT    /api/tournaments/{tournamentId}
DELETE /api/tournaments/{tournamentId}
POST   /api/tournaments/{tournamentId}/players
DELETE /api/tournaments/{tournamentId}/players/{playerId}
POST   /api/tournaments/{tournamentId}/start
GET    /api/tournaments/{tournamentId}/bracket
GET    /api/tournaments/{tournamentId}/current-match
POST   /api/tournaments/{tournamentId}/advance
GET    /api/tournaments/active
```

### Detalles:

#### `POST /api/tournaments`
**Request Body:**
```json
{
  "name": "string",
  "maxPlayers": "number",
  "tournamentType": "single_elimination|double_elimination|round_robin"
}
```
**Response (201):**
```json
{
  "tournamentId": "uuid",
  "name": "string",
  "status": "registration",
  "maxPlayers": "number",
  "currentPlayers": 0,
  "createdAt": "timestamp"
}
```

#### `POST /api/tournaments/{tournamentId}/players`
**Request Body:**
```json
{
  "alias": "string"
}
```
**Response (201):**
```json
{
  "playerId": "uuid",
  "alias": "string",
  "tournamentId": "uuid",
  "position": "number"
}
```

#### `GET /api/tournaments/{tournamentId}/bracket`
**Response (200):**
```json
{
  "tournamentId": "uuid",
  "rounds": [
    {
      "roundNumber": 1,
      "matches": [
        {
          "matchId": "uuid",
          "player1": {
            "playerId": "uuid",
            "alias": "string"
          },
          "player2": {
            "playerId": "uuid",
            "alias": "string"
          },
          "status": "pending|in_progress|completed",
          "winner": "uuid|null"
        }
      ]
    }
  ],
  "currentRound": 1
}
```

#### `GET /api/tournaments/{tournamentId}/current-match`
**Response (200):**
```json
{
  "matchId": "uuid",
  "player1": {
    "playerId": "uuid",
    "alias": "string"
  },
  "player2": {
    "playerId": "uuid",
    "alias": "string"
  },
  "roundNumber": 1,
  "status": "pending"
}
```

---

## **3. Game Service** (Gestión de Partidas)

### Endpoints:

```
POST   /api/games
GET    /api/games/{gameId}
PUT    /api/games/{gameId}
POST   /api/games/{gameId}/start
POST   /api/games/{gameId}/end
GET    /api/games/history
GET    /api/games/user/{userId}/history
POST   /api/games/{gameId}/score
```

### Detalles:

#### `POST /api/games`
**Request Body:**
```json
{
  "tournamentId": "uuid|null",
  "player1Id": "uuid",
  "player2Id": "uuid",
  "gameMode": "local|ai|remote"
}
```
**Response (201):**
```json
{
  "gameId": "uuid",
  "tournamentId": "uuid|null",
  "player1": {
    "playerId": "uuid",
    "alias": "string",
    "score": 0
  },
  "player2": {
    "playerId": "uuid",
    "alias": "string",
    "score": 0
  },
  "status": "waiting",
  "createdAt": "timestamp"
}
```

#### `POST /api/games/{gameId}/start`
**Response (200):**
```json
{
  "gameId": "uuid",
  "status": "in_progress",
  "startedAt": "timestamp",
  "gameState": {
    "ball": {
      "x": 400,
      "y": 300,
      "velocityX": 5,
      "velocityY": 5
    },
    "paddle1": {
      "y": 250
    },
    "paddle2": {
      "y": 250
    }
  }
}
```

#### `POST /api/games/{gameId}/end`
**Request Body:**
```json
{
  "winnerId": "uuid",
  "player1Score": "number",
  "player2Score": "number",
  "duration": "number"
}
```
**Response (200):**
```json
{
  "gameId": "uuid",
  "status": "completed",
  "winner": {
    "playerId": "uuid",
    "alias": "string"
  },
  "finalScore": {
    "player1": 11,
    "player2": 7
  },
  "duration": 320,
  "endedAt": "timestamp"
}
```

#### `GET /api/games/history`
**Query Params:** `?page=1&limit=10&userId=uuid`
**Response (200):**
```json
{
  "games": [
    {
      "gameId": "uuid",
      "player1": {
        "alias": "string",
        "score": 11
      },
      "player2": {
        "alias": "string",
        "score": 7
      },
      "winner": "uuid",
      "duration": 320,
      "playedAt": "timestamp"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50
  }
}
```

---

## **4. Matchmaking Service** (Sistema de Emparejamiento)

### Endpoints:

```
POST   /api/matchmaking/queue
DELETE /api/matchmaking/queue
GET    /api/matchmaking/status
POST   /api/matchmaking/accept
POST   /api/matchmaking/decline
```

### Detalles:

#### `POST /api/matchmaking/queue`
**Request Body:**
```json
{
  "userId": "uuid",
  "gameMode": "ranked|casual",
  "preferences": {
    "maxPing": 100
  }
}
```
**Response (200):**
```json
{
  "queueId": "uuid",
  "status": "searching",
  "estimatedWaitTime": 30,
  "position": 3
}
```

#### `GET /api/matchmaking/status`
**Response (200):**
```json
{
  "queueId": "uuid",
  "status": "match_found",
  "matchId": "uuid",
  "opponent": {
    "userId": "uuid",
    "username": "string"
  },
  "expiresIn": 15
}
```

---

## **5. Statistics Service** (Estadísticas)

### Endpoints:

```
GET    /api/stats/user/{userId}
GET    /api/stats/leaderboard
GET    /api/stats/tournament/{tournamentId}
```

### Detalles:

#### `GET /api/stats/user/{userId}`
**Response (200):**
```json
{
  "userId": "uuid",
  "username": "string",
  "statistics": {
    "totalGames": 50,
    "wins": 30,
    "losses": 20,
    "winRate": 60.0,
    "tournamentsPlayed": 5,
    "tournamentsWon": 2,
    "averageScore": 9.5,
    "totalPlayTime": 15000,
    "rank": 42
  }
}
```

#### `GET /api/stats/leaderboard`
**Query Params:** `?page=1&limit=10&period=all|month|week`
**Response (200):**
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "userId": "uuid",
      "username": "string",
      "wins": 150,
      "winRate": 75.5,
      "points": 2500
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 10
  }
}
```

---

## **6. WebSocket Service** (Juego en Tiempo Real)

### Eventos WebSocket:

```
// Cliente → Servidor
ws://domain/game/{gameId}

CONNECT -> { token: "jwt_token" }
PADDLE_MOVE -> { playerId: "uuid", position: number }
GAME_READY -> { playerId: "uuid" }
DISCONNECT -> { playerId: "uuid" }

// Servidor → Cliente
GAME_STATE -> { ball: {...}, paddle1: {...}, paddle2: {...}, scores: {...} }
SCORE_UPDATE -> { player1Score: number, player2Score: number }
GAME_START -> { timestamp: number }
GAME_END -> { winnerId: "uuid", finalScore: {...} }
PLAYER_JOINED -> { playerId: "uuid", alias: "string" }
PLAYER_LEFT -> { playerId: "uuid" }
ERROR -> { code: string, message: string }
```

### Conexión WebSocket Segura (WSS):

**URL:** `wss://domain/ws/game/{gameId}?token={jwt_token}`

**Mensaje de Estado del Juego (cada frame):**
```json
{
  "type": "GAME_STATE",
  "timestamp": 1234567890,
  "data": {
    "ball": {
      "x": 405.5,
      "y": 298.2,
      "velocityX": 6.2,
      "velocityY": -3.1
    },
    "paddle1": {
      "y": 250,
      "height": 100
    },
    "paddle2": {
      "y": 280,
      "height": 100
    },
    "scores": {
      "player1": 5,
      "player2": 3
    }
  }
}
```

---

## **7. Notification Service** (Notificaciones)

### Endpoints:

```
GET    /api/notifications
PUT    /api/notifications/{notificationId}/read
DELETE /api/notifications/{notificationId}
POST   /api/notifications/read-all
```

---

## **Consideraciones de Seguridad Implementadas:**

### 1. **Autenticación y Autorización:**
- Todos los endpoints protegidos requieren JWT en header: `Authorization: Bearer {token}`
- Tokens con expiración corta (15 min) y refresh tokens
- Validación de roles y permisos en cada microservicio

### 2. **Validación de Entrada:**
```javascript
// Ejemplo de validación en cada endpoint
{
  username: {
    type: 'string',
    minLength: 3,
    maxLength: 20,
    pattern: '^[a-zA-Z0-9_]+$',
    sanitize: true
  }
}
```

### 3. **Protección contra XSS:**
- Sanitización de todos los inputs
- Content Security Policy headers
- Escape de caracteres especiales en respuestas

### 4. **Protección contra SQL Injection:**
- Uso de prepared statements/parametrized queries
- ORM con validación de tipos
- Sanitización en capa de base de datos

### 5. **HTTPS/WSS Obligatorio:**
- Toda comunicación sobre TLS 1.3
- WebSockets seguros (WSS)
- HSTS headers activados

### 6. **Rate Limiting:**
```
POST /api/users/login -> 5 req/min por IP
POST /api/users/register -> 3 req/hour por IP
GET /* -> 100 req/min por usuario
```

### 7. **Headers de Seguridad:**
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
Content-Security-Policy: default-src 'self'
```

---

## **Comunicación entre Microservicios:**

### API Gateway Pattern:
```
Cliente → API Gateway (Puerto 443)
                ↓
    ┌───────────┼───────────┐
    ↓           ↓           ↓
User Service  Game Service  Tournament Service
(Puerto 3001) (Puerto 3002) (Puerto 3003)
```

### Autenticación entre Servicios:
- Service-to-service authentication con JWT
- Mutual TLS para comunicación interna
- Service mesh opcional (Istio/Linkerd)

---

## **Códigos de Error Estandarizados:**

```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Usuario o contraseña incorrectos",
    "status": 401,
    "timestamp": "2025-10-02T10:30:00Z",
    "path": "/api/users/login"
  }
}
```

### Códigos Comunes:
- `400` - Bad Request (validación fallida)
- `401` - Unauthorized (sin autenticar)
- `403` - Forbidden (sin permisos)
- `404` - Not Found
- `409` - Conflict (recurso ya existe)
- `429` - Too Many Requests (rate limit)
- `500` - Internal Server Error

---

Este diseño cumple con todos los requerimientos de seguridad, es escalable mediante microservicios, y proporciona una API REST completa para el sistema de Pong con torneos.
 -->
