from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, desc
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.models import TrackingRecord, Device
from app.schemas import (
    TrackingRecordCreate,
    TrackingRecordRead,
    TrackingRecordBulkCreate,
)

router = APIRouter(prefix="/tracking", tags=["tracking"])


def verify_device_secret(device_id: int, secret: str, db: Session) -> Device:
    # helper to check if it matches up
    device = db.get(Device, device_id)
    if device is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Device not found"
        )
    if device.secret != secret:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid device secret"
        )
    return device


@router.post("", response_model=TrackingRecordRead, status_code=status.HTTP_201_CREATED)
def create_tracking_record(
    payload: TrackingRecordCreate,
    db: Session = Depends(get_db),
):
    verify_device_secret(payload.device_id, payload.secret, db)
    
    # then create
    record_data = payload.model_dump(exclude={"secret"})
    tracking_record = TrackingRecord(**record_data, recorded_at=datetime.utcnow())
    db.add(tracking_record)
    db.commit()
    db.refresh(tracking_record)
    return tracking_record


@router.post("/bulk", response_model=List[TrackingRecordRead], status_code=status.HTTP_201_CREATED)
def create_tracking_records_bulk(
    payload: TrackingRecordBulkCreate,
    db: Session = Depends(get_db),
):
    verify_device_secret(payload.device_id, payload.secret, db)
    
    # can we propagate to the singular one? or just like this
    tracking_records = []
    current_time = datetime.utcnow()
    for record_data in payload.records:
        tracking_record = TrackingRecord(
            device_id=payload.device_id,
            recorded_at=current_time,
            **record_data.model_dump()
        )
        db.add(tracking_record)
        tracking_records.append(tracking_record)
    
    db.commit()
    for record in tracking_records:
        db.refresh(record)
    
    return tracking_records


@router.get("", response_model=List[TrackingRecordRead])
def list_tracking_records(
    device_id: int | None = None,
    limit: int = 100,
    skip: int = 0,
    db: Session = Depends(get_db),
):
    stmt = select(TrackingRecord)
    
    if device_id is not None:
        device = db.get(Device, device_id)
        if device is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Device not found"
            )
        stmt = stmt.where(TrackingRecord.device_id == device_id)
        
    # most recent first
    stmt = stmt.order_by(desc(TrackingRecord.recorded_at))
    stmt = stmt.offset(skip).limit(limit)
    
    return db.scalars(stmt).all()[::-1]


@router.get("/{record_id}", response_model=TrackingRecordRead)
def get_tracking_record(record_id: int, db: Session = Depends(get_db)):
    record = db.get(TrackingRecord, record_id)
    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Tracking record not found"
        )
    return record

