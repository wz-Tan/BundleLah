from datetime import datetime
from decimal import Decimal
from typing import Optional, Any, List, TYPE_CHECKING

from sqlalchemy import String, Numeric, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..db.database import Base

if TYPE_CHECKING:
    from .driver import Driver
    from .cost_split import CostSplit
    from .carbon_log import CarbonLog


class Trip(Base):
    __tablename__ = "trips"

    id: Mapped[int] = mapped_column(primary_key=True)
    driver_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("drivers.id", ondelete="SET NULL")
    )
    route_json: Mapped[Optional[Any]] = mapped_column(JSONB)
    total_distance_km: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2))
    load_factor_pct: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 2))
    route_score: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 2))
    status: Mapped[Optional[str]] = mapped_column(String(20), default="scheduled")
    dispatched_at: Mapped[Optional[datetime]] = mapped_column(DateTime)

    __table_args__ = (
        CheckConstraint(
            "status IN ('scheduled','in_progress','completed','cancelled')",
            name="trips_status_check",
        ),
    )

    driver: Mapped[Optional["Driver"]] = relationship(back_populates="trips")
    cost_splits: Mapped[List["CostSplit"]] = relationship(
        back_populates="trip", cascade="all, delete-orphan"
    )
    carbon_logs: Mapped[List["CarbonLog"]] = relationship(
        back_populates="trip", cascade="all, delete-orphan"
    )