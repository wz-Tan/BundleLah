from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.models import TripListing
from app.schemas import (
    TripListingCreate,
    TripListingUpdate,
    TripListingRead,
)

router = APIRouter(prefix="/trip-listings", tags=["trip-listings"])


@router.post("", response_model=TripListingRead, status_code=status.HTTP_201_CREATED)
def create_trip_listing(
    payload: TripListingCreate,
    db: Session = Depends(get_db),
):
    trip_listing = TripListing(**payload.model_dump())
    db.add(trip_listing)
    db.commit()
    db.refresh(trip_listing)
    return trip_listing


@router.get("", response_model=List[TripListingRead])
def list_trip_listings(
    company_id: Optional[int] = None,
    origin_region: Optional[str] = None,
    destination_region: Optional[str] = None,
    status_filter: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    stmt = select(TripListing)
    if company_id is not None:
        stmt = stmt.where(TripListing.company_id == company_id)
    if origin_region:
        stmt = stmt.where(TripListing.origin_region == origin_region)
    if destination_region:
        stmt = stmt.where(TripListing.destination_region == destination_region)
    if status_filter:
        stmt = stmt.where(TripListing.status == status_filter)
    stmt = stmt.offset(skip).limit(limit)
    return db.scalars(stmt).all()


@router.get("/{trip_listing_id}", response_model=TripListingRead)
def get_trip_listing(trip_listing_id: int, db: Session = Depends(get_db)):
    trip_listing = db.get(TripListing, trip_listing_id)
    if trip_listing is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Trip listing not found"
        )
    return trip_listing


@router.patch("/{trip_listing_id}", response_model=TripListingRead)
def update_trip_listing(
    trip_listing_id: int,
    payload: TripListingUpdate,
    db: Session = Depends(get_db),
):
    trip_listing = db.get(TripListing, trip_listing_id)
    if trip_listing is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Trip listing not found"
        )
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(trip_listing, field, value)
    db.commit()
    db.refresh(trip_listing)
    return trip_listing


@router.delete("/{trip_listing_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_trip_listing(trip_listing_id: int, db: Session = Depends(get_db)):
    trip_listing = db.get(TripListing, trip_listing_id)
    if trip_listing is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Trip listing not found"
        )
    db.delete(trip_listing)
    db.commit()
