from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.models import CargoMatch, CargoRequest, TripListing
from app.schemas import (
    CargoMatchCreate,
    CargoMatchUpdate,
    CargoMatchRead,
)

router = APIRouter(prefix="/cargo-matches", tags=["cargo-matches"])


@router.post("", response_model=CargoMatchRead, status_code=status.HTTP_201_CREATED)
def create_match(payload: CargoMatchCreate, db: Session = Depends(get_db)):
    if db.get(TripListing, payload.trip_listing_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Trip listing not found"
        )
    if db.get(CargoRequest, payload.cargo_request_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Cargo request not found"
        )

    match = CargoMatch(**payload.model_dump())
    db.add(match)
    db.commit()
    db.refresh(match)
    return match


@router.get("", response_model=List[CargoMatchRead])
def list_matches(
    trip_listing_id: Optional[int] = None,
    cargo_request_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    stmt = select(CargoMatch)
    if trip_listing_id is not None:
        stmt = stmt.where(CargoMatch.trip_listing_id == trip_listing_id)
    if cargo_request_id is not None:
        stmt = stmt.where(CargoMatch.cargo_request_id == cargo_request_id)
    if status_filter:
        stmt = stmt.where(CargoMatch.status == status_filter)
    stmt = stmt.offset(skip).limit(limit)
    return db.scalars(stmt).all()


@router.get("/{match_id}", response_model=CargoMatchRead)
def get_match(match_id: int, db: Session = Depends(get_db)):
    match = db.get(CargoMatch, match_id)
    if match is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Match not found"
        )
    return match


@router.patch("/{match_id}", response_model=CargoMatchRead)
def update_match(
    match_id: int,
    payload: CargoMatchUpdate,
    db: Session = Depends(get_db),
):
    match = db.get(CargoMatch, match_id)
    if match is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Match not found"
        )

    data = payload.model_dump(exclude_unset=True)
    new_status = data.get("status")
    for field, value in data.items():
        setattr(match, field, value)

    # Cascade status changes onto the linked records
    if new_status == "accepted":
        cargo_request = db.get(CargoRequest, match.cargo_request_id)
        trip_listing = db.get(TripListing, match.trip_listing_id)
        if cargo_request is not None:
            cargo_request.status = "matched"
        if trip_listing is not None:
            trip_listing.status = "locked"

    db.commit()
    db.refresh(match)
    return match


@router.delete("/{match_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_match(match_id: int, db: Session = Depends(get_db)):
    match = db.get(CargoMatch, match_id)
    if match is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Match not found"
        )

    # Releasing a pending match should free up the linked records again.
    cargo_request = db.get(CargoRequest, match.cargo_request_id)
    trip_listing = db.get(TripListing, match.trip_listing_id)
    if cargo_request is not None and cargo_request.status == "matched":
        cargo_request.status = "open"
    if trip_listing is not None and trip_listing.status == "locked":
        trip_listing.status = "open"

    db.delete(match)
    db.commit()
    return None
