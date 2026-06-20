from datetime import datetime
from decimal import Decimal
from typing import Optional, Literal

from pydantic import BaseModel, ConfigDict

PaymentStatus = Literal["paid", "pending"]


class CostSplitBase(BaseModel):
    match_id: int
    payer_company_id: int
    payee_company_id: int
    amount_rm: Optional[Decimal] = None
    platform_fee_rm: Optional[Decimal] = None


class CostSplitCreate(CostSplitBase):
    pass


class CostSplitUpdate(BaseModel):
    amount_rm: Optional[Decimal] = None
    platform_fee_rm: Optional[Decimal] = None
    payment_status: Optional[PaymentStatus] = None
    paid_at: Optional[datetime] = None


class CostSplitRead(CostSplitBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    payment_status: Optional[PaymentStatus] = None
    paid_at: Optional[datetime] = None
