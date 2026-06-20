from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.dependencies import get_db
from app.models import Company
from app.schemas import CompanyCreate, CompanyRead, LoginRequest

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/register", response_model=CompanyRead, status_code=status.HTTP_201_CREATED
)
def register(payload: CompanyCreate, db: Session = Depends(get_db)):

    if db.scalar(select(Company).where(Company.username == payload.username)):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already registered",
        )

    if db.scalar(select(Company).where(Company.ssm_number == payload.ssm_number)):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="SSM number already registered",
        )

    company = Company(
        **payload.model_dump(exclude={"password"}),
        password=hash_password(payload.password),
    )
    db.add(company)
    db.commit()
    db.refresh(company)
    return company


@router.post("/login", response_model=CompanyRead)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    company = db.scalar(select(Company).where(Company.username == payload.username))
    if not company or not verify_password(company.password, payload.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    return company
