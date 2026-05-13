from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.dependencies import get_current_user
from models.user import User
from schemas.auth import (
    RegisterRequest,
    NgoManagerRegisterRequest,
    NgoStaffRegisterRequest,
    OfficialRegisterRequest,
    SkillsUpdateRequest,
    LocationUpdateRequest,
    LoginRequest,
    TokenResponse,
    UserResponse,
    MeResponse,
    VolunteerProfileResponse,
)
from services import auth_service


class FcmTokenRequest(BaseModel):
    token: str

router = APIRouter(prefix="/auth", tags=["Auth"])


# ─── Kayıt ─────────────────────────────────────────────────────

@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Vatandaş veya Gönüllü kaydı.
    organization_id gönderilmezse → CITIZEN | gönderilirse → VOLUNTEER
    """
    user = await auth_service.register_user(db, data)
    token = auth_service.create_access_token(str(user.id))
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@router.post("/register/ngo-manager", response_model=UserResponse, status_code=201)
async def register_ngo_manager(
    data: NgoManagerRegisterRequest, db: AsyncSession = Depends(get_db)
):
    """STK Yönetim Görevlisi — admin onaylayana kadar giriş yapılamaz."""
    user = await auth_service.register_ngo_manager(db, data)
    return UserResponse.model_validate(user)


@router.post("/register/ngo-staff", response_model=UserResponse, status_code=201)
async def register_ngo_staff(
    data: NgoStaffRegisterRequest, db: AsyncSession = Depends(get_db)
):
    """STK Saha Görevlisi (yalnızca mobil) — yönetici onaylayana kadar giriş yapılamaz."""
    user = await auth_service.register_ngo_staff(db, data)
    return UserResponse.model_validate(user)


@router.post("/register/official", response_model=TokenResponse, status_code=201)
async def register_official(
    data: OfficialRegisterRequest, db: AsyncSession = Depends(get_db)
):
    """Resmi kurum (AFAD, UMKE vb.) çalışanı kaydı.
    Sicil no başı '1' → OFFICIAL_MANAGER (web+mobil giriş)
    Sicil no başı ≠'1' → OFFICIAL_STAFF (sadece mobil giriş)
    Onay gerekmez — kayıt olur olmaz giriş yapabilir.
    """
    user = await auth_service.register_official(db, data)
    token = auth_service.create_access_token(str(user.id))
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


# ─── Giriş ─────────────────────────────────────────────────────

@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Tüm roller için giriş.
    platform='web' → sadece NGO_MANAGER, OFFICIAL_MANAGER, ADMIN girebilir.
    platform='mobile' → herkes girebilir (onaylıysa).
    """
    user, token = await auth_service.login(db, data.email, data.password, data.platform)
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


# ─── Profil ────────────────────────────────────────────────────

@router.get("/me", response_model=MeResponse)
async def me(current_user: User = Depends(get_current_user)):
    return MeResponse.model_validate(current_user)


@router.put("/me/skills", response_model=VolunteerProfileResponse)
async def update_skills(
    data: SkillsUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Gönüllü ilk giriş popup'ında becerilerini kaydeder."""
    profile = await auth_service.update_volunteer_skills(db, current_user, data)
    return VolunteerProfileResponse.model_validate(profile)


@router.put("/me/location", response_model=UserResponse)
async def update_location(
    data: LocationUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Mobil uygulama anlık konumu günceller.
    PostgreSQL + Firebase Realtime DB'ye aynı anda yazar.
    """
    user = await auth_service.update_location(db, current_user, data)
    return UserResponse.model_validate(user)


@router.put("/me/fcm-token", status_code=204)
async def update_fcm_token(
    data: FcmTokenRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Mobil uygulama FCM push notification token'ını kaydeder.
    Uygulama açılışında veya token yenilendiğinde çağrılır.
    """
    await auth_service.update_fcm_token(db, current_user, data.token)
