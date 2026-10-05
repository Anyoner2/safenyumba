# Safe Nyumba API

## Local development

The workspace Python environment is in the repository root. From the repository root, install backend dependencies and start the API:

```powershell
.\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
Set-Location backend
..\.venv\Scripts\python.exe manage.py migrate
..\.venv\Scripts\python.exe manage.py seed_demo_data
..\.venv\Scripts\python.exe manage.py runserver
```

The API is available at `http://127.0.0.1:8000/api/`. The Vite development app calls it automatically.

## Endpoints

- `GET /api/health/`
- `GET /api/properties/` with optional `location`, `budget`, and `bedrooms` query parameters
- `GET /api/estates/`
- `POST /api/auth/register/`
- `POST /api/auth/login/`
- `GET /api/auth/me/` and `POST /api/auth/logout/` with a token

For production, import the GitHub repository into Vercel and set `backend` as the Vercel project's root directory. Add a persistent PostgreSQL database integration and set `DATABASE_URL` to its pooled connection string. Set `DJANGO_SECRET_KEY` to a unique random secret, `DJANGO_DEBUG=false`, and `DJANGO_CORS_ALLOWED_ORIGINS=https://anyoner2.github.io`. Vercel provides `VERCEL_URL`; Django adds that deployment hostname to `ALLOWED_HOSTS` automatically. After the first deployment, run migrations against the production database and seed demo records once. Finally, set `VITE_API_URL` in the frontend deployment environment to the API's HTTPS URL and publish the frontend again. Vercel's function filesystem is not persistent, so production must not use SQLite.
