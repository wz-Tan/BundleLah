from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.models import Vehicle, Company
from app.schemas import VehicleCreate, VehicleUpdate, VehicleRead

router = APIRouter(prefix="/vehicles", tags=["vehicles"])


@router.post("", response_model=VehicleRead, status_code=status.HTTP_201_CREATED)
def create_vehicle(payload: VehicleCreate, db: Session = Depends(get_db)):
    if db.get(Company, payload.company_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Company not found"
        )
    vehicle = Vehicle(**payload.model_dump())
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle


@router.get("", response_model=List[VehicleRead])
def list_vehicles(
    company_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    stmt = select(Vehicle)
    if company_id is not None:
        stmt = stmt.where(Vehicle.company_id == company_id)
    stmt = stmt.offset(skip).limit(limit)
    return db.scalars(stmt).all()


@router.get("/{vehicle_id}", response_model=VehicleRead)
def get_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    vehicle = db.get(Vehicle, vehicle_id)
    if vehicle is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found"
        )
    return vehicle


@router.patch("/{vehicle_id}", response_model=VehicleRead)
def update_vehicle(
    vehicle_id: int,
    payload: VehicleUpdate,
    db: Session = Depends(get_db),
):
    vehicle = db.get(Vehicle, vehicle_id)
    if vehicle is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found"
        )
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(vehicle, field, value)
    db.commit()
    db.refresh(vehicle)
    return vehicle


@router.delete("/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    vehicle = db.get(Vehicle, vehicle_id)
    if vehicle is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found"
        )
    db.delete(vehicle)
    db.commit()
