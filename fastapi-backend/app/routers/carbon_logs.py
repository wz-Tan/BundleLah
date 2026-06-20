from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.models import CarbonLog
from app.schemas import CarbonLogCreate, CarbonLogRead

router = APIRouter(prefix="/carbon-logs", tags=["carbon-logs"])


@router.post("", response_model=CarbonLogRead, status_code=status.HTTP_201_CREATED)
def create_carbon_log(payload: CarbonLogCreate, db: Session = Depends(get_db)):
    carbon_log = CarbonLog(**payload.model_dump())
    db.add(carbon_log)
    db.commit()
    db.refresh(carbon_log)
    return carbon_log


@router.get("", response_model=List[CarbonLogRead])
def list_carbon_logs(
    trip_listing_id: Optional[int] = None,
    cargo_request_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    stmt = select(CarbonLog)
    if trip_listing_id is not None:
        stmt = stmt.where(CarbonLog.trip_listing_id == trip_listing_id)
    if cargo_request_id is not None:
        stmt = stmt.where(CarbonLog.cargo_request_id == cargo_request_id)
    stmt = stmt.offset(skip).limit(limit)
    return db.scalars(stmt).all()


@router.get("/{carbon_log_id}", response_model=CarbonLogRead)
def get_carbon_log(carbon_log_id: int, db: Session = Depends(get_db)):
    carbon_log = db.get(CarbonLog, carbon_log_id)
    if carbon_log is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Carbon log not found"
        )
    return carbon_log
