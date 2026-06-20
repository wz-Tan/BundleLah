from datetime import datetime
from decimal import Decimal
from typing import Optional, List, TYPE_CHECKING

from sqlalchemy import String, Text, Numeric, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..db.database import Base

if TYPE_CHECKING:
    from .driver import Driver
    from .order import Order
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
    created_at: Mapped[Optional[datetime]] = mapped_column(server_default=func.now())

    drivers: Mapped[List["Driver"]] = relationship(
        back_populates="company", cascade="all, delete-orphan"
    )
    orders: Mapped[List["Order"]] = relationship(
        back_populates="company", cascade="all, delete-orphan"
    )
    cost_splits: Mapped[List["CostSplit"]] = relationship(
        back_populates="company", cascade="all, delete-orphan"
    )