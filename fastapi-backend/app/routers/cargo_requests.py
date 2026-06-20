from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_company
from app.models import CargoRequest, Company
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
    current_company: Company = Depends(get_current_company),
):
    data = payload.model_dump()
    data["company_id"] = current_company.id  # always owned by the caller
    cargo_request = CargoRequest(**data)
    db.add(cargo_request)
    db.commit()
    db.refresh(cargo_request)
    return cargo_request


@router.get("", response_model=List[CargoRequestRead])
def list_cargo_requests(
    status_filter: Optional[str] = None,
    mine: bool = False,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_company: Company = Depends(get_current_company),
):
    stmt = select(CargoRequest)
    if mine:
        stmt = stmt.where(CargoRequest.company_id == current_company.id)
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
    current_company: Company = Depends(get_current_company),
):
    cargo_request = db.get(CargoRequest, cargo_request_id)
    if cargo_request is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Cargo request not found"
        )
    if cargo_request.company_id != current_company.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not your cargo request"
        )
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(cargo_request, field, value)
    db.commit()
    db.refresh(cargo_request)
    return cargo_request


@router.delete("/{cargo_request_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_cargo_request(
    cargo_request_id: int,
    db: Session = Depends(get_db),
    current_company: Company = Depends(get_current_company),
):
    cargo_request = db.get(CargoRequest, cargo_request_id)
    if cargo_request is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Cargo request not found"
        )
    if cargo_request.company_id != current_company.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not your cargo request"
        )
    db.delete(cargo_request)
    db.commit()
