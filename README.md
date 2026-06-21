# BundleLah

> Shared freight, shared cost. A B2B platform that lets companies bundle cargo onto the same road trip, split the bill fairly, and cut wasted truck space.

BundleLah is the API that powers a freight ride-sharing marketplace for businesses. Instead of every company sending a half-empty truck down the same highway, BundleLah lets one company schedule a trip and others "hitch a ride" along the route. Everyone shares the fuel and toll cost in proportion to how much they ship and how far they detour. Empty kilometres go down, costs go down, and CO₂ goes down with them.

---

## The Idea in One Picture

```
Company A  ─────────────────────────────────────►  KL
(Penang)         posts a scheduled trip:
                 "Penang → KL, 3,000 kg free, 12 m³ free"

Company B wants to send goods toward KL too
   └─ hitches Company A's trip
   └─ truck makes a short detour to B's drop-off
   └─ B pays a share of the fuel/toll cost

If nobody is heading that way:
Company B  ─────────────────────────────────────►  Johor
(initiator)      posts its own trip
   └─ Company C later hitches this one
```

The first company to post a route is the **initiator**. Any company shipping in the same direction can **join** as long as there is leftover weight and volume capacity. The platform handles the route detour, the available-capacity math, and the fair cost split.

---

## Core Concepts

| Concept | What it means in BundleLah |
| --- | --- |
| **Company** | A registered business account (verified by SSM number) that posts cargo and joins trips. |
| **Driver** | A vehicle + operator belonging to a company, with a max payload and a performance tier badge. |
| **Order** | A request to move goods from a supplier address to a drop-off address, with weight, volume, and a pickup time window. |
| **Trip** | A scheduled route posted by an initiator company and operated by one driver. It carries an origin → destination, departure time, total and remaining weight/volume capacity, and bundles multiple orders. |
| **Cost Split** | Each company's fair share of a trip's cost, computed from weight share and route (detour) share. |
| **Carbon Log** | CO₂ emitted vs. CO₂ avoided for a trip, plus green credits awarded for bundling. |

---

## Features

### Trip marketplace (hitch-a-ride)
- **Post a trip** — a company schedules a road trip (origin → destination) and the platform publishes the **remaining available weight (kg)** and **volume (m³)**.
- **Discover compatible trips** — companies search for trips heading in their direction that still have free capacity.
- **Join a trip** — an order is attached to an existing trip; the route is extended with a short detour for the new pickup/drop-off.
- **Become an initiator** — if no compatible trip exists, the company posts its own trip and waits for others to join.
- **Capacity tracking** — every join decrements remaining weight/volume so trips never get overbooked.

### Fair cost splitting
- Cost is divided using two factors stored on each `CostSplit`:
  - `weight_share_pct` — how much of the load this company contributes.
  - `route_share_pct` — how much extra distance the detour for this company adds.
- Tracks `amount_rm`, `payment_status` (`pending` / `paid`), and `paid_at`.
- A trip-level **cost summary** compares the bundled price against the solo-equivalent price to show each company its **savings**.

### Routing & load optimisation
- Trips store a `route_json` (ordered stops + polyline), `total_distance_km`, `load_factor_pct`, and a `route_score`.
- Geocoded pickup/drop-off coordinates on every order enable map display and detour calculation.
- Pickup time windows (`pickup_window_start` / `pickup_window_end`) keep bundled orders schedule-compatible.

### Carbon impact & green credits
- Each trip logs `co2_emitted_kg` and `co2_avoided_kg`.
- Bundling rewards companies with `credits_awarded`, surfaced as a monthly carbon breakdown.

### Driver performance & tiers
- Drivers carry a `tier_badge` (`bronze`, `silver`, `gold`, `platinum`) and `total_earned`.
- Vehicle `max_payload_kg` constrains which orders can be bundled.

### Wallet & payments
- Each company has a `wallet_balance` for settling cost splits within the platform.

### Order lifecycle
- Orders flow through `pending → grouped → dispatched → delivered` (or `cancelled`), with an optional `priority_flag` for urgent cargo.

---

## Tech Stack

### Backend (`fastapi-backend/`)
| Layer | Technology |
| --- | --- |
| Language | Python 3.11+ |
| Web framework | [FastAPI](https://fastapi.tiangolo.com/) |
| ASGI server | Uvicorn (via `fastapi[standard]`) |
| ORM | SQLAlchemy 2.0 (typed `Mapped` / `mapped_column` models) |
| Validation / settings | Pydantic + `pydantic-settings` |
| Database | SQLite for dev (`database.db`); any SQLAlchemy-supported DB (e.g. PostgreSQL) in prod via `DATABASE_URI` |

### Frontend (`Frontend/`)
| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router) |
| UI library | React 19 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Maps | `@react-google-maps/api` (Google Maps) |

---

## Project Structure

```
fastapi-backend/
├── app/
│   ├── main.py              # FastAPI app + /health route (routers wired here)
│   ├── dependencies.py      # Shared FastAPI dependencies (DB session, settings)
│   ├── core/
│   │   └── config.py        # Pydantic settings loaded from .env
│   ├── db/
│   │   ├── database.py       # Engine, SessionLocal, Base, get_db()
│   │   └── init_db.py        # Creates all tables from the models
│   ├── models/               # SQLAlchemy ORM models
│   │   ├── company.py
│   │   ├── driver.py
│   │   ├── order.py
│   │   ├── trip.py
│   │   ├── cost_split.py
│   │   └── carbon_log.py
│   ├── routers/              # API route handlers (in progress)
│   └── schemas/              # Pydantic request/response schemas (in progress)
├── .env                      # Local environment (not committed)
├── .env.example              # Template for required env vars
└── database.db               # SQLite dev database
```

---

## Data Model

> 📊 See [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md) for full ER and flow diagrams (rendered Mermaid).

```
Company 1───* Driver 1───* Trip *───1 Driver
   │                          │
   │  initiates               ├───* Order *───1 Company
   ├───* Trip                 ├───* CostSplit *───1 Company
   ├───* Order                └───* CarbonLog
   └───* CostSplit
```

- **Company** → has many drivers, orders, and cost splits, and **initiates** many trips (the company that posts a route).
- **Driver** → belongs to a company, operates many trips (constrained by `max_payload_kg`).
- **Order** → belongs to a company; geocoded pickup/drop-off with weight, volume, and time window. Optionally **joins a Trip** (`trip_id`) — null while still looking for a ride.
- **Trip** → posted by an initiator company and operated by a driver; carries origin/destination, departure time, and total vs. **remaining available** weight/volume capacity. Bundles orders, cost splits, and carbon logs.
- **CostSplit** → one row per company sharing a trip; stores the weight/route share and payment status.
- **CarbonLog** → CO₂ emitted/avoided and credits awarded per trip.

---

## Getting Started

### 1. Prerequisites
- Python 3.11+
- (Recommended) a virtual environment

### 2. Install dependencies
From the repository root:
```bash
pip install -r requirements.txt
```

### 3. Configure environment
Create `fastapi-backend/.env` from the example and point it at a database:
```bash
cp fastapi-backend/.env.example fastapi-backend/.env
```
```dotenv
# fastapi-backend/.env
DATABASE_URI=sqlite:///./database.db
DEBUG=true
```
> For PostgreSQL use e.g. `DATABASE_URI=postgresql+psycopg://user:pass@localhost:5432/bundlelah`.

### 4. Create the database tables
```bash
python -m app.db.init_db
```
> Run this from inside the `fastapi-backend` folder so the `app` package resolves.

### 5. Run the API
From the repository root:
```bash
fastapi dev fastapi-backend/app/main.py
```
The API starts at `http://127.0.0.1:8000`.

### 6. Verify
- Health check: `GET http://127.0.0.1:8000/health` → `{"status": "ok"}`
- Interactive docs (Swagger UI): `http://127.0.0.1:8000/docs`
- Alternative docs (ReDoc): `http://127.0.0.1:8000/redoc`

---

## Configuration Reference

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `DATABASE_URI` | Yes | — | SQLAlchemy connection string for the database. |
| `DEBUG` | No | `false` | Enables debug behaviour. |

---

## Roadmap

The `routers/` and `schemas/` folders are scaffolded for the API surface still to be built:

- [ ] Auth & company onboarding (SSM verification, login)
- [ ] Order CRUD + geocoding
- [ ] Trip posting, capacity publishing, and discovery/search by direction
- [ ] Join-a-trip flow with detour routing and capacity checks
- [ ] Cost-split engine (weight share + route share)
- [ ] Wallet top-up and settlement
- [ ] Carbon calculation and green-credit awards
- [ ] Driver dashboard and tier progression
- [ ] Admin overview (live trips, alerts, revenue, load factor)

---

## About

Built for **ImagineHack 2026 @ Taylor's University** by team **Asia Pacific Square Mall**.

AI Declaration : We Used Tools such as Claude, Chatgpt and Kiro for Brainstorming and Coding Assistance
