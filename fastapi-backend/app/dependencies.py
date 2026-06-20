import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.config import get_settings
from app.core.security import ph, decode_access_token
from app.models import Company

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


def get_current_company(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Company:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_access_token(token)
        subject = payload.get("sub")
        if subject is None:
            raise credentials_exception
        company_id = int(subject)
    except (jwt.PyJWTError, ValueError):
        raise credentials_exception

    company = db.get(Company, company_id)
    if company is None:
        raise credentials_exception
    return company


__all__ = [
    "get_db",
    "get_settings",
    "get_current_company",
    "oauth2_scheme",
    "ph",
]
