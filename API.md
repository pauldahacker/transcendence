## API endpoints

### User endpoints

- Endpoint: `POST   /api/users/register`

Request body:
```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```
Response body:
```json
{
  "userId": "uuid",
  "username": "string",
  "email": "string",
}
```

- Endpoint: `POST   /api/users/login`
- Endpoint: `GET    /api/users/profile`
- Endpoint: `PUT    /api/users/profile`
- Endpoint: `POST   /api/users/logout`
- Endpoint: `GET    /api/users/{userId}`
- Endpoint: `DELETE /api/users/{userId}`
- Endpoint: `PUT    /api/users/change-password`

