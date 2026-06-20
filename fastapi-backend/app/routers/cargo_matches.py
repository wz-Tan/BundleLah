from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, or_
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_company
from app.models import CargoMatch, CargoRequest, TripListing, Company
from app.schemas import (
    CargoMatchCreate,
    CargoMatchUpdate,
    CargoMatchRead,
)

router = APIRouter(prefix="/cargo-matches", tags=["cargo-matches"])


def _load_sides(db: Session, payload: CargoMatchCreate):
    trip_listing = db.get(TripListing, payload.trip_listing_id)
    if trip_listing is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Trip listing not found"
        )
    cargo_request = db.get(CargoRequest, payload.cargo_request_id)
    if cargo_request is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Cargo request not found"
        )
    return trip_listing, cargo_request


@router.post("", response_model=CargoMatchRead, status_code=status.HTTP_201_CREATED)
def create_match(
    payload: CargoMatchCreate,
    db: Session = Depends(get_db),
    current_company: Company = Depends(get_current_company),
):
    trip_listing, cargo_request = _load_sides(db, payload)

    # Caller must own one side of the match
    owns_trip = trip_listing.company_id == current_company.id
    owns_cargo = cargo_request.company_id == current_company.id
    if not (owns_trip or owns_cargo):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must own either the trip listing or the cargo request",
        )

    data = payload.model_dump()
    # Derive initiator from ownership if not explicitly provided
    if data.get("initiated_by") is None:
        data["initiated_by"] = "carrier" if owns_trip else "shipper"

    match = CargoMatch(**data)
    db.add(match)
    db.commit()
    db.refresh(match)
    return match


@router.get("", response_model=List[CargoMatchRead])
def list_matches(
    status_filter: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_company: Company = Depends(get_current_company),
):
    # Matches where the caller owns either side
    stmt = (
        select(CargoMatch)
        .join(TripListing, CargoMatch.trip_listing_id == TripListing.id)
        .join(CargoRequest, CargoMatch.cargo_request_id == CargoRequest.id)
        .where(
            or_(
                TripListing.company_id == current_company.id,
                CargoRequest.company_id == current_company.id,
            )
        )
    )
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
    current_company: Company = Depends(get_current_company),
):
    match = db.get(CargoMatch, match_id)
    if match is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Match not found"
        )

    trip_listing = db.get(TripListing, match.trip_listing_id)
    cargo_request = db.get(CargoRequest, match.cargo_request_id)
    owns_trip = trip_listing is not None and trip_listing.company_id == current_company.id
    owns_cargo = cargo_request is not None and cargo_request.company_id == current_company.id
    if not (owns_trip or owns_cargo):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not a party to this match"
        )

    data = payload.model_dump(exclude_unset=True)
    new_status = data.get("status")
    for field, value in data.items():
        setattr(match, field, value)

    # Cascade status changes onto the linked records
    if new_status == "accepted":
        if cargo_request is not None:
            cargo_request.status = "matched"
        if trip_listing is not None:
            trip_listing.status = "locked"

    db.commit()
    db.refresh(match)
    return match
