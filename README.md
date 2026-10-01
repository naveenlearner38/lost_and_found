# Lost & Found

Community site for reporting lost and found items.

- `backend/` – Node.js + Express REST API (JWT auth, image uploads, JSON-file storage)
- `frontend/` – Next.js (App Router) UI

## Run

```bash
# API (http://localhost:4000)
cd backend && cp .env.example .env && npm install && npm run dev

# Web (http://localhost:3000)
cd frontend && cp .env.example .env.local && npm install && npm run dev
```
Set `JWT_SECRET` for the backend in production. Backend tests: `cd backend && npm test`.

## Features
Sign up / log in, post lost or found items with a photo, search and filter, message the poster,
and mark posts resolved or delete them from "My items".

## API
`POST /api/auth/register|login`, `GET /api/auth/me`, `GET|POST /api/items`, `GET|PATCH|DELETE /api/items/:id`,
`GET|POST /api/items/:id/messages` (GET is owner-only), `GET /api/categories`.
