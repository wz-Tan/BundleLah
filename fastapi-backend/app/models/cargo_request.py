from datetime import datetime
from decimal import Decimal
from typing import Optional, List, TYPE_CHECKING

from sqlalchemy import (
    Text,
    Numeric,
    Float,
    Boolean,
    DateTime,
    String,
    ForeignKey,
    CheckConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..db.database import Base

if TYPE_CHECKING:
    from .company import Company
    from .cargo_match import CargoMatch
    from .carbon_log import CarbonLog


class CargoRequest(Base):
    """A company's request to move goods A -> B ("I need to move this")."""

    __tablename__ = "cargo_requests"

    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE")
    )
    pickup_address: Mapped[str] = mapped_column(Text, nullable=False)
    pickup_lat: Mapped[Optional[float]] = mapped_column(Float)
    pickup_lng: Mapped[Optional[float]] = mapped_column(Float)
    dropoff_address: Mapped[str] = mapped_column(Text, nullable=False)
    dropoff_lat: Mapped[Optional[float]] = mapped_column(Float)
    dropoff_lng: Mapped[Optional[float]] = mapped_column(Float)
    weight_kg: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2))
    volume_m3: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2))
    pickup_window_start: Mapped[Optional[datetime]] = mapped_column(DateTime)
    pickup_window_end: Mapped[Optional[datetime]] = mapped_column(DateTime)
    status: Mapped[Optional[str]] = mapped_column(String(20), default="open")
    priority_flag: Mapped[Optional[bool]] = mapped_column(Boolean, default=False)
    # Cold-chain / safety monitoring requirements. A threshold being set means
    # that sensor is required; NULL means it isn't. motion_required is on/off.
    temp_threshold_c: Mapped[Optional[Decimal]] = mapped_column(Numeric(6, 2))
    humidity_threshold_pct: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 2))
    ethylene_threshold_ppm: Mapped[Optional[Decimal]] = mapped_column(Numeric(6, 2))
    motion_required: Mapped[Optional[bool]] = mapped_column(Boolean, default=False)
    created_at: Mapped[Optional[datetime]] = mapped_column(server_default=func.now())

    __table_args__ = (
        CheckConstraint(
            "status IN ('open','matched','in_transit','delivered','cancelled')",
            name="cargo_requests_status_check",
        ),
    )

    company: Mapped[Optional["Company"]] = relationship(
        back_populates="cargo_requests"
    )
    matches: Mapped[List["CargoMatch"]] = relationship(
        back_populates="cargo_request", cascade="all, delete-orphan"
    )
    carbon_logs: Mapped[List["CarbonLog"]] = relationship(
        back_populates="cargo_request"
    )
