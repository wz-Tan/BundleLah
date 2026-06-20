from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_company
from app.models import TripListing, Company
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
    current_company: Company = Depends(get_current_company),
):
    data = payload.model_dump()
    data["company_id"] = current_company.id  # the listing belongs to the caller
    trip_listing = TripListing(**data)
    db.add(trip_listing)
    db.commit()
    db.refresh(trip_listing)
    return trip_listing


@router.get("", response_model=List[TripListingRead])
def list_trip_listings(
    origin_region: Optional[str] = None,
    destination_region: Optional[str] = None,
    status_filter: Optional[str] = None,
    mine: bool = False,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_company: Company = Depends(get_current_company),
):
    stmt = select(TripListing)
    if mine:
        stmt = stmt.where(TripListing.company_id == current_company.id)
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
    current_company: Company = Depends(get_current_company),
):
    trip_listing = db.get(TripListing, trip_listing_id)
    if trip_listing is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Trip listing not found"
        )
    if trip_listing.company_id != current_company.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not your trip listing"
        )
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(trip_listing, field, value)
    db.commit()
    db.refresh(trip_listing)
    return trip_listing


@router.delete("/{trip_listing_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_trip_listing(
    trip_listing_id: int,
    db: Session = Depends(get_db),
    current_company: Company = Depends(get_current_company),
):
    trip_listing = db.get(TripListing, trip_listing_id)
    if trip_listing is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Trip listing not found"
        )
    if trip_listing.company_id != current_company.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not your trip listing"
        )
    db.delete(trip_listing)
    db.commit()
