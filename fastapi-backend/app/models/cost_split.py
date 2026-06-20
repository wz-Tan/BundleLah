from datetime import datetime
from decimal import Decimal
from typing import Optional, TYPE_CHECKING

from sqlalchemy import Numeric, String, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..db.database import Base

if TYPE_CHECKING:
    from .trip import Trip
    from .company import Company


class CostSplit(Base):
    __tablename__ = "cost_splits"

    id: Mapped[int] = mapped_column(primary_key=True)
    trip_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("trips.id", ondelete="CASCADE")
    )
    company_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE")
    )
    amount_rm: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2))
    weight_share_pct: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 2))
    route_share_pct: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 2))
    payment_status: Mapped[Optional[str]] = mapped_column(
        String(20), default="pending"
    )
    paid_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    __table_args__ = (
        CheckConstraint(
            "payment_status IN ('paid','pending')",
            name="cost_splits_payment_status_check",
        ),
    )

    trip: Mapped[Optional["Trip"]] = relationship(back_populates="cost_splits")
    company: Mapped[Optional["Company"]] = relationship(back_populates="cost_splits")