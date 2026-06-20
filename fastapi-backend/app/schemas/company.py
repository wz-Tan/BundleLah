from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict


class CompanyBase(BaseModel):
    name: str
    username: str
    ssm_number: str
    address: str
    vehicle_type: Optional[str] = None
    license_plate: Optional[str] = None
    max_payload_kg: Optional[Decimal] = None


class CompanyCreate(CompanyBase):
    password: str


class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    password: Optional[str] = None
    address: Optional[str] = None
    vehicle_type: Optional[str] = None
    license_plate: Optional[str] = None
    max_payload_kg: Optional[Decimal] = None


class CompanyRead(CompanyBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    wallet_balance: Optional[Decimal] = None
    created_at: Optional[datetime] = None
