
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, desc
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.models import Device, CargoMatch, TrackingRecord
from app.schemas import DeviceCreate, DeviceRead, DevicePublic, DeviceAlerts, AlertDetail

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
        
    # use secret from user
    device = Device(
        cargo_match_id=payload.cargo_match_id,
        secret=payload.secret,
        temperature_threshold=payload.temperature_threshold,
        humidity_threshold=payload.humidity_threshold,
        ethylene_threshold=payload.ethylene_threshold,
        motion_alarm=payload.motion_alarm
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


# this returns all records for this device that exceed the thresholds
@router.get("/{device_id}/alerts", response_model=DeviceAlerts)
def get_device_alerts(device_id: int, db: Session = Depends(get_db)):
    device = db.get(Device, device_id)
    if device is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Device not found"
        )
    
    
    stmt = (
        select(TrackingRecord)
        .where(TrackingRecord.device_id == device_id)
        .order_by(desc(TrackingRecord.recorded_at))
    )
    records = db.scalars(stmt).all()
    
    alerts = []
    
    for record in records:
        # Check temperature threshold
        if (
            device.temperature_threshold is not None
            and record.temperature is not None
            and record.temperature > device.temperature_threshold
        ):
            alerts.append(
                AlertDetail(
                    alert_type="temperature",
                    current_value=record.temperature,
                    threshold=device.temperature_threshold,
                    message=f"Temperature {record.temperature}°C exceeds threshold of {device.temperature_threshold}°C",
                    timestamp=record.recorded_at,
                )
            )
        
        # Check humidity threshold
        if (
            device.humidity_threshold is not None
            and record.humidity is not None
            and record.humidity > device.humidity_threshold
        ):
            alerts.append(
                AlertDetail(
                    alert_type="humidity",
                    current_value=record.humidity,
                    threshold=device.humidity_threshold,
                    message=f"Humidity {record.humidity}% exceeds threshold of {device.humidity_threshold}%",
                    timestamp=record.recorded_at,
                )
            )
        
        # Check ethylene threshold
        if (
            device.ethylene_threshold is not None
            and record.ethylene_level is not None
            and record.ethylene_level > device.ethylene_threshold
        ):
            alerts.append(
                AlertDetail(
                    alert_type="ethylene",
                    current_value=record.ethylene_level,
                    threshold=device.ethylene_threshold,
                    message=f"Ethylene level {record.ethylene_level} ppm exceeds threshold of {device.ethylene_threshold} ppm",
                    timestamp=record.recorded_at,
                )
            )
        
        # Check motion alarm
        if (
            device.motion_alarm is True
            and record.motion_detected is True
        ):
            alerts.append(
                AlertDetail(
                    alert_type="motion",
                    current_value=True,
                    threshold=True,
                    message="Motion detected while motion alarm is enabled",
                    timestamp=record.recorded_at,
                )
            )
    
    return DeviceAlerts(device_id=device_id, alerts=alerts)
