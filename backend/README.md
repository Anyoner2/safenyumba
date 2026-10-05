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

For production, set `DJANGO_SECRET_KEY`, `DJANGO_DEBUG=false`, `DJANGO_ALLOWED_HOSTS`, and `DJANGO_CORS_ALLOWED_ORIGINS` in the hosting provider. Configure the deployed frontend build with `VITE_API_URL` pointing to the HTTPS API URL. The local SQLite database is for development only; use the hosting provider's persistent database for production.
