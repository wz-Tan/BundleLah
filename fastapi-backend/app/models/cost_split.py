from datetime import datetime
from decimal import Decimal
from typing import Optional, TYPE_CHECKING

from sqlalchemy import Numeric, String, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..db.database import Base

if TYPE_CHECKING:
    from .cargo_match import CargoMatch
    from .company import Company


class CostSplit(Base):
    """Money owed from one company (payer) to another (payee) for a match."""

    __tablename__ = "cost_splits"

    id: Mapped[int] = mapped_column(primary_key=True)
    match_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("cargo_matches.id", ondelete="CASCADE")
    )
    payer_company_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("companies.id")
    )
    payee_company_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("companies.id")
    )
    amount_rm: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2))
    platform_fee_rm: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2))
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

    match: Mapped[Optional["CargoMatch"]] = relationship(back_populates="cost_splits")
    payer: Mapped[Optional["Company"]] = relationship(
        back_populates="cost_splits_as_payer",
        foreign_keys=[payer_company_id],
    )
    payee: Mapped[Optional["Company"]] = relationship(
        back_populates="cost_splits_as_payee",
        foreign_keys=[payee_company_id],
    )
