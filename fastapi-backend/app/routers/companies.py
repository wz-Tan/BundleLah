from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_company
from app.core.security import hash_password
from app.models import Company
from app.schemas import CompanyRead, CompanyUpdate

router = APIRouter(prefix="/companies", tags=["companies"])


@router.get("", response_model=List[CompanyRead])
def list_companies(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    return db.scalars(select(Company).offset(skip).limit(limit)).all()


@router.patch("/me", response_model=CompanyRead)
def update_me(
    payload: CompanyUpdate,
    db: Session = Depends(get_db),
    current_company: Company = Depends(get_current_company),
):
    data = payload.model_dump(exclude_unset=True)
    if "password" in data:
        data["password"] = hash_password(data.pop("password"))
    for field, value in data.items():
        setattr(current_company, field, value)
    db.commit()
    db.refresh(current_company)
    return current_company


@router.get("/{company_id}", response_model=CompanyRead)
def get_company(company_id: int, db: Session = Depends(get_db)):
    company = db.get(Company, company_id)
    if company is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Company not found"
        )
    return company
