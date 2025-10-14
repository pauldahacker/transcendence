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

### Endpoint: `POST   /api/users/match`

Request body:
```json
{
  "tournament_id": "number",
  "match_id": "number",
  "match_date": "string",
  "a_participant_id": "number",
  "b_participant_id": "number",
  "a_participant_score": "number",
  "b_participant_score": "number",
  "winner_id": "number",
  "loser_id": "number"
}
```
Response body:
```json
{
  "tournament_id": "number",
  "match_id": "number",
  "match_date": "string",
  "a_participant_id": "number",
  "b_participant_id": "number",
  "a_participant_score": "number",
  "b_participant_score": "number",
  "winner_id": "number",
  "loser_id": "number"
}
```
Error responses:
- `401`: Invalid token header
- `400`: Bad request

### Endpoint: `GET    /api/users/{user_id}/`

Response body:
```json
{
  "username": "string",
  "display_name": "string",
  "avatar_url": "string",
  "bio": "string",
  "created_at": "string"
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
  "created_at": "string"
}
```
Error responses:
- `401`: Invalid token header
- `404`: User not found
- `403`: User not authorized

### Endpoint: `DELETE /api/users/{user_id}/`

Response body:
```json
{
  "message": "User deleted"
}
```
Error responses:
- `401`: Invalid token header
- `404`: User not found
- `403`: User not authorized

### Endpoint: `GET    /api/users/:user_id/stats`

Response body:
```json
{
  "total_games": "number",
  "wins": "number",
  "losses": "number"
}
```
Error responses:
- `401`: Invalid token header
- `404`: User not found

### Endpoint: `GET    /api/users/:user_id/friends`

Query parameter `filter`:
- `confirmed`: returns only confirmed friends
- `pending`: returns only pending friend requests
- `requested`: returns only sent friend requests

[!TIP]
> Use the `filter` query parameter adding `?filter=<value>` to the endpoint URL.

Response body:
```json
[
  {
    "id": "number",
    "username": "string",
    "display_name": "string",
    "avatar_url": "string",
    "confirmed": "boolean",
    "requested_by_id": "number"
  }
]
```
Error responses:
- `401`: Invalid token header
- `404`: User not found

### Endpoint: `GET    /api/users/:user_id/match_history`

Response body:
```json
[
  {
    "tournament_id": "number",
    "match_id": "number",
    "match_date": "string",
    "opponent_username": "string",
    "user_score": "string",
    "opponent_score": "string",
    "result": "win|loss",
  }
]
```
Error responses:
- `401`: Invalid token header
- `404`: User not found

### Endpoint: `POST    /api/users/:user_id/friend-request`

User with id `:user_id` recieves a friend request from the authenticated user.

Response body:

On first request (`user_1` sends request to user `user_2`):
```json
{
  "message": "Friend request sent"
}
```
On second request (`user_2` sends request to user `user_1`):
```json
{
  "message": "Friend request accepted"
}
```
Error responses:
- `401`: Invalid token header
- `400`: Cannot send friend request to oneself
- `400`: Cannot send friend request to an existing friend
- `409`: Friend request already exists
- `404`: User not found

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

##### Side effect: match **score reporting** (internal)
On successful scoring, the service optionally reports the result to the **Users** domain (via the API Gateway) depending on the participants and the `REPORT_GUEST_AS_ZERO` flag (set both in the .env and in the docker-compose.tournaments.yml):

| Scenario | Reporting behavior |
|---|---|
| **User vs User** (both sides have real user IDs `> 0`) | **Report**: includes `winner_user_id` and `loser_user_id` (both real) |
| **User vs Guest** (exactly one side has real user ID `> 0`) & `REPORT_GUEST_AS_ZERO = true` | **Report**: includes the real user; the guest is sent as `0` |
| **User vs Guest** & `REPORT_GUEST_AS_ZERO = false` | **No report** |
| **Guest vs Guest** (no real user IDs) | **No report** |

> A “real user” means a participant that resolves to a **numeric user ID > 0**. Participants mapped to `0` are considered **guests**.

With this approach, the **Users** domain can safely ignore any payloads where user_id is 0, without modifying its existing schema or business logic.

If you need to change this behavior later, set ```REPORT_GUEST_AS_ZERO=false``` to stop emitting reports for user-vs-guest matches (if zero as user ID becomes unacceptable).

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
