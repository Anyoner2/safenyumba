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
- `GET /api/properties/` with optional `location`, `budget` (maximum rent), `minRent`, `maxRent`, `bedrooms`, `kind`, and `amenity` query parameters
- `POST /api/viewing-requests/` accepts a public viewing or contact request for an available property
- `GET /api/estates/`
- `GET /api/estates/:slug/overview/` provides verified estate inventory and unit availability statuses, a vacant-home count, aggregate tenant-record and unresolved-issue counts, emergency contacts, and recent announcements without exposing tenant or maintenance-report details
- `GET /api/estates/:slug/nearby-places/` returns named shops, medical facilities, schools, and transport stops from OpenStreetMap around a geocoded approximate estate centre
- `POST /api/property-submissions/` accepts optional `latitude` and `longitude` GPS coordinates
- `POST /api/auth/register/`
- `POST /api/auth/login/`
- `GET /api/auth/me/` and `POST /api/auth/logout/` with a token
- `GET /api/rent-payments/`, `POST /api/rent-payments/`, and `PATCH /api/rent-payments/:id/paid/` with a token
- `GET /api/dashboard/landlord/` and `GET /api/dashboard/estate/` with a token and the matching account role
- `POST /api/owner/properties/` and owner-scoped `POST`/`PATCH /api/owner/properties/:propertyId/units/` operations with a landlord token
- `GET /api/saved-properties/`, `POST /api/saved-properties/:id/`, and `DELETE /api/saved-properties/:id/` with a token
- `GET /api/notifications/` and `PATCH /api/notifications/read-all/` with a token
- `PATCH /api/properties/:id/vacancy/` with an assigned estate-manager token
- `GET /api/maintenance-requests/` and `POST /api/maintenance-requests/` with a token; estate managers can update status using `PATCH /api/maintenance-requests/:id/status/`
- Public `GET /api/announcements/` (optional `estate` filter); assigned estate managers can publish with `POST /api/announcements/`
- Public `GET /api/emergency-contacts/` (optional `estate` filter); assigned estate managers can add and remove their estate contacts with `POST /api/emergency-contacts/` and `DELETE /api/emergency-contacts/:id/`
- `GET /api/recommendations/` ranks verified, available homes using optional `location`, `budget`, `bedrooms`, and `amenity` preferences. Matching is deterministic and runs in the API; it does not send preferences to an external AI service.

New accounts default to the `landlord` role; roles cannot be selected during registration. To assign an estate manager, update the account from an administrative PostgreSQL session after the estate exists:

```sql
UPDATE users
SET role = 'estate_manager', managed_estate = 'kilimani'
WHERE email = 'manager@example.com';
```

Estate slugs are available from `GET /api/estates/`; seed listings add neighbourhood entries beyond Kilimani, Westlands, and Muthaiga. Estate managers see portfolio, rent aggregates, and viewing requests for their assigned estate only. Occupancy is an estimate based on current-month rent-tracked units and verified vacant listings.

Estate managers can update availability for listings in their assigned estate. When a listing changes from unavailable to available, the API creates an in-app notification for each account that saved it. Availability, saved listings, and notifications persist in PostgreSQL when `DATABASE_URL` is configured; otherwise they use the development in-memory store.

Signed-in accounts can report maintenance issues for an estate and unit. Reporters can see their own requests; estate managers can see and update requests for their assigned estate. Estate managers can publish public announcements for their assigned estate. Requests and announcements persist in PostgreSQL when `DATABASE_URL` is configured; otherwise they use the development in-memory store.

Property owners can register immediately published properties from the landlord dashboard, add rentable units with monthly rent and bedroom count, manage tenant details, and set each unit to vacant, occupied, or reserved. Upload up to five JPEG, PNG, or WebP photos per property (1 MB per photo); photos are stored in PostgreSQL when `DATABASE_URL` is configured and in the development in-memory store otherwise. Tenant details and unit-management operations are private to their owner; estate overviews show only property and unit listing details, rent, and availability status.

Prospective tenants can request a viewing or contact the property owner from a listing. The request includes their contact details and appears in the property owner's dashboard (or the estate manager's dashboard for seed listings). Viewing requests persist in PostgreSQL when `DATABASE_URL` is configured; otherwise they use the development in-memory store.

Rent records belong to the authenticated landlord account. Link each record to an estate to include it in that estate's aggregate dashboard. With `DATABASE_URL` configured, the API stores accounts and records in PostgreSQL; without it, the development server uses an in-memory store.

The landlord tenancy-document tool generates a print-ready agreement draft in the browser and can use the browser print dialog to save a PDF. It does not store agreement details or provide e-signatures or legal advice; the draft should be reviewed against current Kenyan law before signing.

Property owners can capture GPS coordinates in the browser or place a pin on the OpenStreetMap widget while submitting a property. Coordinates are optional, validated as a latitude/longitude pair, and stored only with the private submission for verification. Public sample listing pins are approximate neighbourhood locations, not property addresses. OpenStreetMap receives requests for the map tiles covering the visible area, including when a GPS pin recentres the map; the submitted coordinates themselves are not included in the submission response or public property listings. OpenStreetMap tiles require an internet connection and display OpenStreetMap attribution; browser GPS permission requires a secure context (HTTPS or localhost).

Estate overview nearby-place lookups send the estate name and area to OpenStreetMap's Nominatim geocoder, then request mapped places within 2 km of its approximate result from Overpass. Results are cached in the API process for six hours, attributed to OpenStreetMap contributors, and may be incomplete; verify locations independently. Estate resident totals count distinct tenant records attached to occupied units matching that estate's location. Only the aggregate is public; tenant names, contact details, unit references, and maintenance report content are not included. The estate inventory lists verified home and unit details with their availability status; only vacant units are counted as available.

Potential listing issues are surfaced as review prompts, not fraud determinations. Duplicate checks require the same city, neighbourhood, and bedroom count, then an identical title or near-equal rent corroborated by a similar title or photo. Unusually low rent is flagged only when at least four comparable listings exist. Residents should independently verify details and avoid paying before confirming a property. Estate-specific emergency contacts are maintained by the assigned estate manager; the emergency page also shows Kenya's national emergency numbers.

For production, import the GitHub repository into Vercel and set `backend` as the Vercel project's root directory. Add a persistent PostgreSQL database integration and set `DATABASE_URL` to its pooled connection string. Finally, set `VITE_API_URL` in the frontend deployment environment to the API's HTTPS URL and publish the frontend again. Vercel's function filesystem is not persistent, so production must use PostgreSQL.
