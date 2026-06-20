from datetime import datetime
from decimal import Decimal
from typing import Optional, TYPE_CHECKING

from sqlalchemy import String, Text, Numeric, Float, Boolean, DateTime, ForeignKey, CheckConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..db.database import Base

if TYPE_CHECKING:
    from .company import Company


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE")
    )
    supplier_address: Mapped[str] = mapped_column(Text, nullable=False)
    pickup_lat: Mapped[Optional[float]] = mapped_column(Float)
    pickup_lng: Mapped[Optional[float]] = mapped_column(Float)
    dropoff_address: Mapped[str] = mapped_column(Text, nullable=False)
    dropoff_lat: Mapped[Optional[float]] = mapped_column(Float)
    dropoff_lng: Mapped[Optional[float]] = mapped_column(Float)
    weight_kg: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2))
    volume_m3: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2))
    pickup_window_start: Mapped[Optional[datetime]] = mapped_column(DateTime)
    pickup_window_end: Mapped[Optional[datetime]] = mapped_column(DateTime)
    status: Mapped[Optional[str]] = mapped_column(String(20), default="pending")
    priority_flag: Mapped[Optional[bool]] = mapped_column(Boolean, default=False)
    created_at: Mapped[Optional[datetime]] = mapped_column(server_default=func.now())

    __table_args__ = (
        CheckConstraint(
            "status IN ('pending','grouped','dispatched','delivered','cancelled')",
            name="orders_status_check",
        ),
    )

    company: Mapped[Optional["Company"]] = relationship(back_populates="orders")