## API endpoints

### User endpoints

- Endpoint: `POST   /api/users/register`

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
- `409`: Username already exists

- Endpoint: `POST   /api/users/login`

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

- Endpoint: `POST   /api/users/logout`

Response body:
```json
{
  "message": "
- Endpoint: `GET    /api/users/{userId}`
- Endpoint: `DELETE /api/users/{userId}`
- Endpoint: `PUT    /api/users/change-password`

