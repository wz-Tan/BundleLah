
from typing import List
import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.models import Device, CargoMatch
from app.schemas import DeviceCreate, DeviceRead, DevicePublic

router = APIRouter(prefix="/devices", tags=["devices"])


@router.post("", response_model=DeviceRead, status_code=status.HTTP_201_CREATED)
def create_device(
    payload: DeviceCreate,
    db: Session = Depends(get_db),
):
    cargo_match = db.get(CargoMatch, payload.cargo_match_id)
    if cargo_match is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Cargo match not found"
        )
    
    # generate some secret
    device_secret = secrets.token_hex(32)
    
    device = Device(
        cargo_match_id=payload.cargo_match_id,
        secret=device_secret
    )
    db.add(device)
    db.commit()
    db.refresh(device)
    return device


@router.get("", response_model=List[DevicePublic])
def list_devices(
    cargo_match_id: int,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    stmt = select(Device).where(Device.cargo_match_id == cargo_match_id)
    stmt = stmt.offset(skip).limit(limit)
    return db.scalars(stmt).all()


@router.get("/{device_id}", response_model=DevicePublic)
def get_device(device_id: int, db: Session = Depends(get_db)):
    device = db.get(Device, device_id)
    if device is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Device not found"
        )
    return device
