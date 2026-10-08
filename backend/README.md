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
- `GET /api/dashboard/landlord/` and `GET /api/dashboard/estate/` with a token and the matching account role

New accounts default to the `landlord` role; roles cannot be selected during registration. To assign an estate manager, update the account from an administrative PostgreSQL session after the estate exists:

```sql
UPDATE users
SET role = 'estate_manager', managed_estate = 'kilimani'
WHERE email = 'manager@example.com';
```

Supported estate slugs are `kilimani`, `westlands`, and `muthaiga`. Estate managers see portfolio and rent aggregates for their assigned estate only. Occupancy is an estimate based on current-month rent-tracked units and verified vacant listings.

Rent records belong to the authenticated landlord account. Link each record to an estate to include it in that estate's aggregate dashboard. With `DATABASE_URL` configured, the API stores accounts and records in PostgreSQL; without it, the development server uses an in-memory store.

For production, import the GitHub repository into Vercel and set `backend` as the Vercel project's root directory. Add a persistent PostgreSQL database integration and set `DATABASE_URL` to its pooled connection string. Finally, set `VITE_API_URL` in the frontend deployment environment to the API's HTTPS URL and publish the frontend again. Vercel's function filesystem is not persistent, so production must use PostgreSQL.
