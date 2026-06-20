from datetime import datetime
from decimal import Decimal
from typing import Optional, List, TYPE_CHECKING

from sqlalchemy import String, Text, Numeric, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..db.database import Base

if TYPE_CHECKING:
    from .cargo_request import CargoRequest
    from .trip_listing import TripListing
    from .cost_split import CostSplit


class Company(Base):
    __tablename__ = "companies"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    username: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    password: Mapped[str] = mapped_column(Text, nullable=False)
    ssm_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    address: Mapped[str] = mapped_column(Text, nullable=False)
    wallet_balance: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(12, 2), default=0
    )

    # Vehicle / fleet info (simplified for hackathon — the company is the carrier)
    vehicle_type: Mapped[Optional[str]] = mapped_column(String(100))
    license_plate: Mapped[Optional[str]] = mapped_column(String(20), unique=True)
    max_payload_kg: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2))

    created_at: Mapped[Optional[datetime]] = mapped_column(server_default=func.now())

    cargo_requests: Mapped[List["CargoRequest"]] = relationship(
        back_populates="company", cascade="all, delete-orphan"
    )
    trip_listings: Mapped[List["TripListing"]] = relationship(
        back_populates="company", cascade="all, delete-orphan"
    )
    cost_splits_as_payer: Mapped[List["CostSplit"]] = relationship(
        back_populates="payer",
        foreign_keys="CostSplit.payer_company_id",
    )
    cost_splits_as_payee: Mapped[List["CostSplit"]] = relationship(
        back_populates="payee",
        foreign_keys="CostSplit.payee_company_id",
    )
