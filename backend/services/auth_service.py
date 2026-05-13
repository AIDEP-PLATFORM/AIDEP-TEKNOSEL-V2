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
from core.constants import WEB_ALLOWED_ROLES
from models.user import (
    User, VolunteerProfile, NgoManagerProfile,
    NgoStaffProfile, OfficialProfile, Organization, UserRole,
)
from geoalchemy2.shape import from_shape
from shapely.geometry import Point

from schemas.auth import (
    RegisterRequest,
    NgoManagerRegisterRequest,
    NgoStaffRegisterRequest,
    OfficialRegisterRequest,
    SkillsUpdateRequest,
    LocationUpdateRequest,
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
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: Optional[str] = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                                detail="Geçersiz token")
        return user_id
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Geçersiz veya süresi dolmuş token")


# ─── Kullanıcı Sorguları ────────────────────────────────────────

async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def get_user_by_id(db: AsyncSession, user_id: str) -> Optional[User]:
    result = await db.execute(
        select(User)
        .where(User.id == user_id)
        .options(
            selectinload(User.volunteer_profile).selectinload(VolunteerProfile.organization),
            selectinload(User.ngo_manager_profile).selectinload(NgoManagerProfile.organization),
            selectinload(User.ngo_staff_profile).selectinload(NgoStaffProfile.organization),
            selectinload(User.official_profile).selectinload(OfficialProfile.organization),
        )
    )
    return result.scalar_one_or_none()


# ─── Kayıt: Vatandaş / Gönüllü ─────────────────────────────────

async def register_user(db: AsyncSession, data: RegisterRequest) -> User:
    await _check_email_phone(db, data.email, data.phone)

    if data.organization_id:
        await _check_organization_exists(db, data.organization_id)
        role = UserRole.VOLUNTEER
    else:
        role = UserRole.CITIZEN

    user = User(
        id=uuid4(), email=data.email, phone=data.phone,
        password_hash=hash_password(data.password),
        full_name=data.full_name, tc_no=data.tc_no,
        role=role, is_active=True,
    )
    db.add(user)
    await db.flush()

    if role == UserRole.VOLUNTEER:
        db.add(VolunteerProfile(
            id=uuid4(), user_id=user.id,
            organization_id=data.organization_id,
            skills=[], skills_completed=False,
        ))
        logger.info(f"Yeni gönüllü: {user.email} → org={data.organization_id}")
    else:
        logger.info(f"Yeni vatandaş: {user.email}")

    await db.commit()
    await db.refresh(user)
    return user


# ─── Kayıt: STK Yönetim Görevlisi ──────────────────────────────

async def register_ngo_manager(db: AsyncSession, data: NgoManagerRegisterRequest) -> User:
    await _check_email_phone(db, data.email, data.phone)
    await _check_organization_exists(db, data.organization_id)

    user = User(
        id=uuid4(), email=data.email, phone=data.phone,
        password_hash=hash_password(data.password),
        full_name=data.full_name, tc_no=data.tc_no,
        role=UserRole.NGO_MANAGER, is_active=False,
    )
    db.add(user)
    await db.flush()

    db.add(NgoManagerProfile(
        id=uuid4(), user_id=user.id,
        organization_id=data.organization_id,
        activity_areas=data.activity_areas,
        address=data.address,
    ))
    await db.commit()
    await db.refresh(user)
    logger.info(f"Yeni NGO yöneticisi (onay bekliyor): {user.email}")
    return user


# ─── Kayıt: STK Saha Görevlisi ─────────────────────────────────

async def register_ngo_staff(db: AsyncSession, data: NgoStaffRegisterRequest) -> User:
    await _check_email_phone(db, data.email, data.phone)
    await _check_organization_exists(db, data.organization_id)

    user = User(
        id=uuid4(), email=data.email, phone=data.phone,
        password_hash=hash_password(data.password),
        full_name=data.full_name, tc_no=data.tc_no,
        role=UserRole.NGO_STAFF, is_active=False,
    )
    db.add(user)
    await db.flush()

    db.add(NgoStaffProfile(
        id=uuid4(), user_id=user.id,
        organization_id=data.organization_id,
    ))
    await db.commit()
    await db.refresh(user)
    logger.info(f"Yeni saha görevlisi (onay bekliyor): {user.email}")
    return user


# ─── Kayıt: Resmi Kurum Çalışanı ───────────────────────────────

async def register_official(db: AsyncSession, data: OfficialRegisterRequest) -> User:
    """Sicil no başı '1' → OFFICIAL_MANAGER (web+mobil)
    Sicil no başı ≠'1' → OFFICIAL_STAFF (sadece mobil)
    Onay gerekmez — sicil numarası yeterli.
    """
    await _check_email_phone(db, data.email, data.phone)
    await _check_organization_exists(db, data.organization_id)

    # Sicil numarası benzersizlik kontrolü
    existing = await db.execute(
        select(OfficialProfile).where(
            OfficialProfile.registration_number == data.registration_number
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Bu sicil numarası zaten kayıtlı",
        )

    role = (
        UserRole.OFFICIAL_MANAGER
        if data.registration_number.startswith("1")
        else UserRole.OFFICIAL_STAFF
    )

    user = User(
        id=uuid4(), email=data.email, phone=data.phone,
        password_hash=hash_password(data.password),
        full_name=data.full_name, tc_no=data.tc_no,
        role=role, is_active=True,
    )
    db.add(user)
    await db.flush()

    db.add(OfficialProfile(
        id=uuid4(), user_id=user.id,
        organization_id=data.organization_id,
        registration_number=data.registration_number,
        address=data.address,
    ))
    await db.commit()
    await db.refresh(user)
    logger.info(
        f"Yeni resmi {'yetkili' if role == UserRole.OFFICIAL_MANAGER else 'personel'}: "
        f"{user.email} sicil={data.registration_number}"
    )
    return user


# ─── Beceri Güncelleme ──────────────────────────────────────────

async def update_volunteer_skills(
    db: AsyncSession, user: User, data: SkillsUpdateRequest
) -> VolunteerProfile:
    if user.role != UserRole.VOLUNTEER or not user.volunteer_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu işlem sadece gönüllüler için geçerlidir",
        )
    profile = user.volunteer_profile
    profile.skills = data.skills
    profile.skills_completed = True
    await db.commit()
    await db.refresh(profile)
    logger.info(f"Gönüllü becerileri güncellendi: {user.email}")
    return profile


# ─── Konum Güncelleme ───────────────────────────────────────────

async def update_location(
    db: AsyncSession, user: User, data: LocationUpdateRequest
) -> User:
    """
    Mobil uygulamadan gelen anlık konumu:
    1. PostgreSQL users.current_location'a kaydeder (kalıcı)
    2. Firebase Realtime DB'ye yazar (gerçek zamanlı)

    Firebase path: locations/<user_id>
    """
    from core.firebase import db_set
    import asyncio

    user.current_location = from_shape(
        Point(data.longitude, data.latitude), srid=4326
    )
    await db.commit()
    await db.refresh(user)

    # Firebase'e arka planda yaz (hata olursa engelleme)
    try:
        await db_set(
            f"locations/{user.id}",
            {
                "lat": data.latitude,
                "lon": data.longitude,
                "user_id": str(user.id),
                "role": user.role.value,
                "updated_at": int(asyncio.get_event_loop().time()),
            },
        )
    except Exception as exc:
        logger.warning("Firebase konum yazma hatası: %s", exc)

    logger.info(f"Konum güncellendi: {user.email} → ({data.latitude}, {data.longitude})")
    return user


async def update_fcm_token(db: AsyncSession, user: User, token: str) -> None:
    """Kullanıcının FCM push notification token'ını günceller."""
    user.fcm_token = token
    await db.commit()
    logger.info("FCM token güncellendi: %s", user.email)


# ─── Giriş ─────────────────────────────────────────────────────

async def login(
    db: AsyncSession,
    email: str,
    password: str,
    platform: str = "mobile",
) -> tuple[User, str]:
    user = await get_user_by_email(db, email)
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-posta veya şifre hatalı",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hesabınız onay bekliyor",
        )
    if platform == "web" and user.role not in WEB_ALLOWED_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Web girişi bu hesap türü için kullanılamaz",
        )
    token = create_access_token(str(user.id))
    return user, token


# ─── Yardımcı ───────────────────────────────────────────────────

async def _check_email_phone(db: AsyncSession, email: str, phone: str) -> None:
    if (await db.execute(select(User).where(User.email == email))).scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Bu e-posta zaten kayıtlı")
    if (await db.execute(select(User).where(User.phone == phone))).scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Bu telefon numarası zaten kayıtlı")


async def _check_organization_exists(db: AsyncSession, org_id) -> None:
    if not (await db.execute(
        select(Organization).where(Organization.id == org_id)
    )).scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Seçilen kurum şubesi bulunamadı")
