# Safe Nyumba API

## Local development

From `backend`, install dependencies and start the API:

```powershell
npm install
npm run dev
```

The API is available at `http://127.0.0.1:4000/api/`. The Vite development app calls it automatically.

## Endpoints

- `GET /api/health/`
- `GET /api/properties/` with optional `location`, `budget`, and `bedrooms` query parameters
- `GET /api/estates/`
- `POST /api/auth/register/`
- `POST /api/auth/login/`
- `GET /api/auth/me/` and `POST /api/auth/logout/` with a token
- `GET /api/rent-payments/`, `POST /api/rent-payments/`, and `PATCH /api/rent-payments/:id/paid/` with a token

Rent records belong to the authenticated account. With `DATABASE_URL` configured, the API stores them in PostgreSQL; without it, the development server uses an in-memory store.

For production, import the GitHub repository into Vercel and set `backend` as the Vercel project's root directory. Add a persistent PostgreSQL database integration and set `DATABASE_URL` to its pooled connection string. Finally, set `VITE_API_URL` in the frontend deployment environment to the API's HTTPS URL and publish the frontend again. Vercel's function filesystem is not persistent, so production must use PostgreSQL.
