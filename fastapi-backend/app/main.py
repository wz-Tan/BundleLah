from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import (
    auth,
    carbon_logs,
    cargo_matches,
    cargo_requests,
    companies,
    cost_splits,
    trip_listings,
    vehicles,
)

app = FastAPI(title="BundleLah API")

# Allow the Next.js dev server (and configured origins) to call the API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(companies.router)
app.include_router(vehicles.router)
app.include_router(cargo_requests.router)
app.include_router(trip_listings.router)
app.include_router(cargo_matches.router)
app.include_router(cost_splits.router)
app.include_router(carbon_logs.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
