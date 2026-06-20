from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict


class VehicleBase(BaseModel):
    company_id: int
    vehicle_type: Optional[str] = None
    license_plate: Optional[str] = None
    max_payload_kg: Optional[Decimal] = None


class VehicleCreate(VehicleBase):
    pass


class VehicleUpdate(BaseModel):
    vehicle_type: Optional[str] = None
    license_plate: Optional[str] = None
    max_payload_kg: Optional[Decimal] = None


class VehicleRead(VehicleBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
