# Mini Restaurant Offers System (Full Stack)

A fully runnable mini system with:

- **Backend API**: Node.js + Express, in-memory store
- **Frontend UI**: Next.js (React) single-screen app (list + create)
- **AI toggle stub**: simple sorting logic when enabled

## Run Locally

### 1) Backend (Express)

```bash
cd backend
npm install
npm run dev
```

Backend runs on: `http://localhost:4000`

On startup, the backend seeds a set of active offers so the UI is never empty.

### 2) Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on: `http://localhost:3000`

#### Optional: Configure API base URL

By default the frontend calls `http://localhost:4000`.

To override:

```bash
cd frontend
echo 'NEXT_PUBLIC_API_BASE_URL=http://localhost:4000' > .env.local
```

## API

### `POST /offers`

Create a new offer.

Request body:

```json
{
  "restaurant_name": "string",
  "start_time": "ISO datetime string",
  "end_time": "ISO datetime string",
  "discount_percent": 25
}
```

Example:

```bash
curl -X POST http://localhost:4000/offers \
  -H 'Content-Type: application/json' \
  -d '{
    "restaurant_name": "Sushi Place",
    "start_time": "2030-01-01T10:00:00.000Z",
    "end_time": "2030-01-01T14:00:00.000Z",
    "discount_percent": 30
  }'
```

### `GET /offers`

Returns **active offers only**.

Active means: server time is between `start_time` and `end_time` (inclusive).

Query param:

- `enable_smart_recommendations=true|false`

Example:

```bash
curl "http://localhost:4000/offers?enable_smart_recommendations=true"
```

Response shape:

```json
{
  "enable_smart_recommendations": true,
  "server_time": "ISO datetime string",
  "offers": []
}
```

## AI Toggle (Current Behavior)

This project includes an “AI toggle” stub:

- When `enable_smart_recommendations=true`: active offers are sorted by **highest discount first**
- When `false`: active offers are returned in **creation order** (in-memory insertion order)

Implementation lives in the backend service layer: [offersService.js](file:///Users/apple/Documents/zezt-test/backend/src/services/offersService.js).

## Frontend Notes

- The UI includes:
  - an offers list (active offers)
  - a create-offer form that calls `POST /offers`
  - clear network/validation error states (client-side + backend validation)
- Default backend URL is `http://localhost:4000` and can be overridden with `NEXT_PUBLIC_API_BASE_URL`.

## Where Real ML Would Plug In Later

The current “smart recommendations” logic is intentionally simple (a deterministic sort). A production-grade approach could replace/augment it by:

- Calling an external recommendation service (model API) from the backend
- Using restaurant/user context (location, cuisine preferences, historical conversions)
- Returning a **ranked list** (or scored offers) instead of a basic sort

The natural integration point is replacing the sorting branch in `getActiveOffers(...)` with:

- a call to a model/service that returns scores for each offer, or
- a retrieval + ranking step that selects the best offers per user/session.

## Project Structure

```text
project-root/
  backend/
    src/
      data/
      routes/
      services/
      index.js
    package.json
  frontend/
    app/
      components/
      layout.tsx
      page.tsx
    package.json
  README.md
```
