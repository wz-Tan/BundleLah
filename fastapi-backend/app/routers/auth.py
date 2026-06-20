from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_company
from app.core.security import hash_password, verify_password, create_access_token
from app.models import Company
from app.schemas import CompanyCreate, CompanyRead, Token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=CompanyRead, status_code=status.HTTP_201_CREATED)
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


@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    company = db.scalar(
        select(Company).where(Company.username == form_data.username)
    )
    if not company or not verify_password(company.password, form_data.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(company.id)
    return Token(access_token=access_token, token_type="bearer")


@router.get("/me", response_model=CompanyRead)
def read_me(current_company: Company = Depends(get_current_company)):
    return current_company
