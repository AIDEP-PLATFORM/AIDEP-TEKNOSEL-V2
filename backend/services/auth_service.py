import logging
from datetime import datetime, timedelta, timezone
from uuid import uuid4
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status

from core.config import settings
from models.user import User, VolunteerProfile, NgoProfile, UserRole
from schemas.auth import (
    CitizenRegisterRequest,
    VolunteerRegisterRequest,
    NgoRegisterRequest,
)

logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ─── Şifre ─────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


# ─── JWT ────────────────────────────────────────────────────────

def create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload = {"sub": user_id, "exp": expire}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> str:
    """Token'ı çöz, user_id döndür. Hatalıysa exception fırlat."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: Optional[str] = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Geçersiz token",
            )
        return user_id
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Geçersiz veya süresi dolmuş token",
        )


# ─── Kullanıcı Sorguları ────────────────────────────────────────

async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def get_user_by_id(db: AsyncSession, user_id: str) -> Optional[User]:
    result = await db.execute(
        select(User)
        .where(User.id == user_id)
        .options(
            selectinload(User.volunteer_profile),
            selectinload(User.ngo_profile),
        )
    )
    return result.scalar_one_or_none()


# ─── Kayıt ─────────────────────────────────────────────────────

async def register_citizen(db: AsyncSession, data: CitizenRegisterRequest) -> User:
    await _check_email_phone(db, data.email, data.phone)

    user = User(
        id=uuid4(),
        email=data.email,
        phone=data.phone,
        password_hash=hash_password(data.password),
        full_name=data.full_name,
        role=UserRole.CITIZEN,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    logger.info(f"Yeni vatandas kaydi: {user.email}")
    return user


async def register_volunteer(db: AsyncSession, data: VolunteerRegisterRequest) -> User:
    await _check_email_phone(db, data.email, data.phone)

    user = User(
        id=uuid4(),
        email=data.email,
        phone=data.phone,
        password_hash=hash_password(data.password),
        full_name=data.full_name,
        role=UserRole.VOLUNTEER,
    )
    db.add(user)
    await db.flush()  # user.id'yi al

    profile = VolunteerProfile(
        id=uuid4(),
        user_id=user.id,
        skills=data.skills,
        preferred_ngo_id=data.preferred_ngo_id,
    )
    db.add(profile)
    await db.commit()
    await db.refresh(user)
    logger.info(f"Yeni gonullu kaydi: {user.email}")
    return user


async def register_ngo(db: AsyncSession, data: NgoRegisterRequest) -> User:
    await _check_email_phone(db, data.email, data.phone)

    # Yetki numarası daha önce alınmış mı?
    existing = await db.execute(
        select(NgoProfile).where(NgoProfile.authorization_number == data.authorization_number)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Bu yetki numarası zaten kayıtlı",
        )

    user = User(
        id=uuid4(),
        email=data.email,
        phone=data.phone,
        password_hash=hash_password(data.password),
        full_name=data.full_name,
        role=UserRole.NGO,
    )
    db.add(user)
    await db.flush()

    profile = NgoProfile(
        id=uuid4(),
        user_id=user.id,
        organization_name=data.organization_name,
        authorization_number=data.authorization_number,
    )
    db.add(profile)
    await db.commit()
    await db.refresh(user)
    logger.info(f"Yeni STK kaydi: {user.email} / {data.organization_name}")
    return user


# ─── Giriş ─────────────────────────────────────────────────────

async def login(db: AsyncSession, email: str, password: str) -> tuple[User, str]:
    user = await get_user_by_email(db, email)
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-posta veya şifre hatalı",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hesap devre dışı",
        )
    token = create_access_token(str(user.id))
    return user, token


# ─── Yardımcı ───────────────────────────────────────────────────

async def _check_email_phone(db: AsyncSession, email: str, phone: str) -> None:
    existing_email = await db.execute(select(User).where(User.email == email))
    if existing_email.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Bu e-posta zaten kayıtlı",
        )
    existing_phone = await db.execute(select(User).where(User.phone == phone))
    if existing_phone.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Bu telefon numarası zaten kayıtlı",
        )
