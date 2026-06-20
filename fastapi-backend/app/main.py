from fastapi import FastAPI

from app.routers import (
    auth,
    companies,
    cargo_requests,
    trip_listings,
    cargo_matches,
    cost_splits,
    carbon_logs,
)

app = FastAPI(title="BundleLah API")

app.include_router(auth.router)
app.include_router(companies.router)
app.include_router(cargo_requests.router)
app.include_router(trip_listings.router)
app.include_router(cargo_matches.router)
app.include_router(cost_splits.router)
app.include_router(carbon_logs.router)


@app.get('/health')
async def health():
    return {'status': 'ok'}
