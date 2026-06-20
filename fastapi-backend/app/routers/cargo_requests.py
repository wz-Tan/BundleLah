from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.models import CargoRequest
from app.schemas import (
    CargoRequestCreate,
    CargoRequestUpdate,
    CargoRequestRead,
)

router = APIRouter(prefix="/cargo-requests", tags=["cargo-requests"])


@router.post("", response_model=CargoRequestRead, status_code=status.HTTP_201_CREATED)
def create_cargo_request(
    payload: CargoRequestCreate,
    db: Session = Depends(get_db),
):
    cargo_request = CargoRequest(**payload.model_dump())
    db.add(cargo_request)
    db.commit()
    db.refresh(cargo_request)
    return cargo_request


@router.get("", response_model=List[CargoRequestRead])
def list_cargo_requests(
    company_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    stmt = select(CargoRequest)
    if company_id is not None:
        stmt = stmt.where(CargoRequest.company_id == company_id)
    if status_filter:
        stmt = stmt.where(CargoRequest.status == status_filter)
    stmt = stmt.offset(skip).limit(limit)
    return db.scalars(stmt).all()


@router.get("/{cargo_request_id}", response_model=CargoRequestRead)
def get_cargo_request(cargo_request_id: int, db: Session = Depends(get_db)):
    cargo_request = db.get(CargoRequest, cargo_request_id)
    if cargo_request is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Cargo request not found"
        )
    return cargo_request


@router.patch("/{cargo_request_id}", response_model=CargoRequestRead)
def update_cargo_request(
    cargo_request_id: int,
    payload: CargoRequestUpdate,
    db: Session = Depends(get_db),
):
    cargo_request = db.get(CargoRequest, cargo_request_id)
    if cargo_request is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Cargo request not found"
        )
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(cargo_request, field, value)
    db.commit()
    db.refresh(cargo_request)
    return cargo_request


@router.delete("/{cargo_request_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_cargo_request(cargo_request_id: int, db: Session = Depends(get_db)):
    cargo_request = db.get(CargoRequest, cargo_request_id)
    if cargo_request is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Cargo request not found"
        )
    db.delete(cargo_request)
    db.commit()
