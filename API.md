# API endpoints

This document describes the RESTful API endpoints provided by the User Service of the Pong application. The service is built using Fastify and provides user management functionalities including registration, authentication, profile management, and user listing.

> [!TIP]
> For frontend integration, the base URL to use is `https://api:3000/`. Also, container authentication is done via API key in the `x-internal-api-key` header. Such key is set in the environment variable `INTERNAL_API_KEY`.

## User endpoints

> [!TIP]
> All endpoints except `/api/users/register` and `/api/users/login` require user authentication via JWT in the `Authorization` header as `Bearer {token}`. Such token is obtained upon successful login.

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

> **Base (via API Gateway):** `https://localhost/api/tournaments/*`  
> **Auth:** `Authorization: Bearer <jwt>` (end‑user) **or** `x-internal-api-key: <INTERNAL_API_KEY>` (service-to-service).  
> **CORS:** `OPTIONS /api/tournaments/*` is handled **at the gateway** (no auth, `204` with CORS headers). Services do **not** handle CORS.

> **MVP note:** Participant count must be a **power of two** before `start` (e.g., 2/4/8/16…). Otherwise `400` with `participants_not_power_of_two`.

---

### Create a draft tournament

**POST** `/api/tournaments`

Creates a tournament in `draft` status.

**Request body**
```json
{
  "mode": "single_elimination",
  "points_to_win": 11,
  "owner_user_id": null
}
```
- `mode` — currently only `"single_elimination"`
- `points_to_win` — integer `1..21` (inclusive)
- `owner_user_id` — integer ID or `null` (no cross‑DB FK)

**Responses**
- `201`
  ```json
  { "id": 1 }
  ```
- `400` — validation error

---

### Get a tournament by id

**GET** `/api/tournaments/{id}`

**Responses**
- `200`
  ```json
  {
    "id": 1,
    "owner_user_id": null,
    "mode": "single_elimination",
    "points_to_win": 11,
    "status": "draft",
    "created_at": "2025-10-10T00:00:00.000Z"
  }
  ```
- `404` `{ "status": "not_found" }`

**Params**
- `{id}` — integer `>= 1` (invalid returns `400`)

---

### Participants

Aliases let humans or bots join a draft tournament. Display names are unique **per tournament**.

#### Join
**POST** `/api/tournaments/{id}/participants`

**Request body**
```json
{
  "display_name": "Alice",
  "is_bot": false
}
```
- `display_name` — non-empty string, max 64
- `is_bot` — boolean (default `false`)

**Responses**
- `201` `{ "id": 7 }`
- `404` `{ "status": "not_found" }` — unknown tournament
- `409` `{ "status": "conflict", "message": "alias already joined" }`

#### List
**GET** `/api/tournaments/{id}/participants`

**Responses**
- `200`
  ```json
  [
    {
      "id": 7,
      "tournament_id": 1,
      "display_name": "Alice",
      "joined_at": "2025-10-11T00:00:00.000Z",
      "is_bot": false
    }
  ]
  ```
- `404` `{ "status": "not_found" }`

#### Remove
**DELETE** `/api/tournaments/{id}/participants/{participant_id}`

**Responses**
- `204` (no body) — removed
- `404` `{ "status": "not_found" }` — participant not in this tournament

**Params**
- `{id}`, `{participant_id}` — integers `>= 1` (invalid returns `400`)

---

### Start a tournament (single-elimination)

**POST** `/api/tournaments/{id}/start`

Transitions a `draft` tournament to `active` and creates **round 1** matches with deterministic seeding (join order).

**Responses**
- `200`
  ```json
  { "status": "active", "rounds": 2, "matches_created": 2 }
  ```
- `400`
  ```json
  { "status": "bad_request", "message": "need_at_least_2_participants" }
  ```
  or
  ```json
  { "status": "bad_request", "message": "participants_not_power_of_two" }
  ```
- `404` `{ "status": "not_found" }` — unknown tournament
- `409` `{ "status": "conflict", "message": "already_started" }` — not in `draft`

---

### Matches

#### List matches (optionally by round)
**GET** `/api/tournaments/{id}/matches?round={n}`

**Responses**
- `200`
  ```json
  [
    {
      "id": 12,
      "tournament_id": 1,
      "round": 1,
      "order_index": 0,
      "a_participant_id": 3,
      "b_participant_id": 4,
      "status": "scheduled",
      "score_a": null,
      "score_b": null,
      "winner_participant_id": null,
      "updated_at": "2025-10-11T13:10:00.000Z"
    }
  ]
  ```
- `404` `{ "status": "not_found" }` — unknown tournament

**Params**
- `{id}` — integer `>= 1`
- `round` — optional integer `>= 1` (invalid returns `400`)

#### Score a match (and auto-advance)
**POST** `/api/tournaments/{id}/matches/{mid}/score`

Finishes a scheduled/in_progress match, records the score, **places the winner** into the next round’s container match (creating it if needed), and completes the tournament when the final ends.

**Request body**
```json
{ "score_a": 11, "score_b": 7 }
```

**Responses**
- `200` — the **finished** match entity (see above)
- `400` — bad request, e.g. `{ "status":"bad_request","message":"tie_not_allowed" }` or tournament not active
- `404` — unknown tournament or match `{ "status":"not_found" }`
- `409` — match already finished `{ "status":"conflict","message":"match_already_finished" }`

**Params**
- `{id}`, `{mid}` — integers `>= 1`

#### Get next scheduled match
**GET** `/api/tournaments/{id}/next`

**Responses**
- `200` — a single **scheduled** match entity (earliest by `round, order_index, id`)
- `204` — no scheduled matches remain
- `404` — `{ "status": "not_found" }`

---

### Health (service diagnostics)

> Exposed for internal checks; through the gateway they’re protected by the same auth as other endpoints.

- `GET https://localhost/api/tournaments/health` → `{"status":"ok"}`
- `GET https://localhost/api/tournaments/health/db` → DB connectivity
- `OPTIONS https://localhost/api/tournaments/*` → `204` + CORS headers (no auth)

---

### Notes & invariants

- SQLite via **better-sqlite3** (`PRAGMA foreign_keys=ON`); timestamps are **ISO TEXT**.
- No CORS handling inside services; the **API Gateway** owns preflight and headers.
- No auth enforced inside service business routes; the **Gateway** owns auth.
- **Status codes:** `201` creates, `204` deletes, `200` for OK, `400/404/409` for errors (JSON), `500` unexpected.

---

### Curl examples (via gateway)

```bash
# Create a draft tournament
curl -sk -H "x-internal-api-key: $INTERNAL_API_KEY"   -H 'content-type: application/json'   -X POST https://localhost/api/tournaments   --data '{"mode":"single_elimination","points_to_win":11}'

# Join with an alias
curl -sk -H "x-internal-api-key: $INTERNAL_API_KEY"   -H 'content-type: application/json'   -X POST https://localhost/api/tournaments/1/participants   --data '{"display_name":"Alice"}'

# List participants
curl -sk -H "x-internal-api-key: $INTERNAL_API_KEY"   https://localhost/api/tournaments/1/participants

# Remove a participant
curl -sk -H "x-internal-api-key: $INTERNAL_API_KEY"   -X DELETE https://localhost/api/tournaments/1/participants/7

# Start a tournament
curl -sk -H "x-internal-api-key: $INTERNAL_API_KEY"   -X POST https://localhost/api/tournaments/1/start

# List round 1 matches
curl -sk -H "x-internal-api-key: $INTERNAL_API_KEY"   "https://localhost/api/tournaments/1/matches?round=1"

# Score a match
curl -sk -H "x-internal-api-key: $INTERNAL_API_KEY"   -H 'content-type: application/json'   -X POST https://localhost/api/tournaments/1/matches/12/score   --data '{"score_a":11,"score_b":7}'

# Next scheduled match
curl -sk -H "x-internal-api-key: $INTERNAL_API_KEY"   https://localhost/api/tournaments/1/next
```
### Testing via TournamentDev
```
https://localhost/#/tournament-dev

1
Health checks
Click GET /api/tournaments/health --- exepct HTTP 200 {"status":"ok"}
Click GET /api/tournaments/health/db --- expect HTTP 200 {"status":"ok"}
2
Create a tournament
Click POST /api/tournaments
Expect HTTP 201 { "id": <N> }
Copy <N> into the Tournament id inptu
3
Join participants (x4)
In Participant alias, enter A --- POST /:id/participants --- expect HTTP 201 { "id": <pidA> }
Repeat for B, C, D
Click GET /:id/participants --- expect 4 rows (A,B,C,D with their ids)
4
Start the tournament
Click POST /:id/start
Expect HTTP 200 { "status":"active", "rounds": 2, "matches_created": 2 }
5
List round 1 matches
In Round, eneter 1
Click GET /:id/matches?round=N
Expect 2 matches (both status: "scheduled"). Note their match ids (e.g., 5 and 6)
6
Next scheduled
Click GET /:id/next
Expect one match (a round-1 scheuled match)
7
Score round 1
In Match id (mid), enter the first R1 id (e.g., 5)
Set Score A/B (e.g., 11 and 7)
Click POST /:id/matches/:mid/score --- expect HTTP 200 and the finished match (with winner_participant_id)
Repeat for second R1 match (e.g., 6)
8
List the final (round 2)
Set Round = 2
GET /:id/matches?round=N --- expect 1 final match  (scheduled)
9
Next scheduled (final)
GET /:id/next --- returns that final match
10
Score the final
Put final mid in Match id
Enter scores (no ties; e.g., 11 vs 9)
POST /:id/matches/:mid/score --- expect HTTP 200 (now tournament may compelete)
11
Tha’s it, no matches left
GET /:id/next --- expect HTTP 204
GET /:id --- expect status: "completed"

12
You can also try accessing a match not started, add duplicates etc to test for possible errors. 
It is all done in the test suite but  thgere’s no harm in trying ))

```

## Health endpoints

All services expose a health check endpoint at `/health` that can be used to verify that the service is running and healthy.

Response body:
```json
{
  "status": "ok",
}
```

- **Direct service (internal):**
  - `GET https://tournaments:${TOURNAMENTS_PORT}/health` → `{"status":"ok"}`
  - `GET https://tournaments:${TOURNAMENTS_PORT}/health/db` → DB connectivity check

- **Via API Gateway (protected):**
  - `GET https://api:3000/api/tournaments/health` → requires JWT or `x-internal-api-key`
  - `GET https://api:3000/api/tournaments/health/db` → requires JWT or `x-internal-api-key`
  - `OPTIONS https://api:3000/api/tournaments/*` → returns `204` with CORS headers (no auth)



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
