from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, or_
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_company
from app.models import CostSplit, Company
from app.schemas import CostSplitCreate, CostSplitUpdate, CostSplitRead

router = APIRouter(prefix="/cost-splits", tags=["cost-splits"])


@router.post("", response_model=CostSplitRead, status_code=status.HTTP_201_CREATED)
def create_cost_split(
    payload: CostSplitCreate,
    db: Session = Depends(get_db),
    current_company: Company = Depends(get_current_company),
):
    cost_split = CostSplit(**payload.model_dump())
    db.add(cost_split)
    db.commit()
    db.refresh(cost_split)
    return cost_split


@router.get("", response_model=List[CostSplitRead])
def list_cost_splits(
    role: Optional[str] = None,  # "payer" | "payee"
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_company: Company = Depends(get_current_company),
):
    stmt = select(CostSplit)
    if role == "payer":
        stmt = stmt.where(CostSplit.payer_company_id == current_company.id)
    elif role == "payee":
        stmt = stmt.where(CostSplit.payee_company_id == current_company.id)
    else:
        stmt = stmt.where(
            or_(
                CostSplit.payer_company_id == current_company.id,
                CostSplit.payee_company_id == current_company.id,
            )
        )
    stmt = stmt.offset(skip).limit(limit)
    return db.scalars(stmt).all()


@router.get("/{cost_split_id}", response_model=CostSplitRead)
def get_cost_split(cost_split_id: int, db: Session = Depends(get_db)):
    cost_split = db.get(CostSplit, cost_split_id)
    if cost_split is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Cost split not found"
        )
    return cost_split


@router.post("/{cost_split_id}/pay", response_model=CostSplitRead)
def pay_cost_split(
    cost_split_id: int,
    db: Session = Depends(get_db),
    current_company: Company = Depends(get_current_company),
):
    cost_split = db.get(CostSplit, cost_split_id)
    if cost_split is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Cost split not found"
        )
    if cost_split.payer_company_id != current_company.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the payer can settle this cost split",
        )
    if cost_split.payment_status == "paid":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Already paid"
        )
    cost_split.payment_status = "paid"
    cost_split.paid_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(cost_split)
    return cost_split
