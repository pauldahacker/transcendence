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

- Endpoint: `POST   /api/users/login`
- Endpoint: `GET    /api/users/profile`
- Endpoint: `PUT    /api/users/profile`
- Endpoint: `POST   /api/users/logout`
- Endpoint: `GET    /api/users/{userId}`
- Endpoint: `DELETE /api/users/{userId}`
- Endpoint: `PUT    /api/users/change-password`

