from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.dependencies import get_current_user
from models.user import User
from schemas.auth import (
    CitizenRegisterRequest,
    VolunteerRegisterRequest,
    NgoRegisterRequest,
    LoginRequest,
    TokenResponse,
    UserResponse,
    MeResponse,
)
from services import auth_service

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register/citizen", response_model=TokenResponse, status_code=201)
async def register_citizen(
    data: CitizenRegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    user = await auth_service.register_citizen(db, data)
    token = auth_service.create_access_token(str(user.id))
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@router.post("/register/volunteer", response_model=TokenResponse, status_code=201)
async def register_volunteer(
    data: VolunteerRegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    user = await auth_service.register_volunteer(db, data)
    token = auth_service.create_access_token(str(user.id))
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@router.post("/register/ngo", response_model=TokenResponse, status_code=201)
async def register_ngo(
    data: NgoRegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    user = await auth_service.register_ngo(db, data)
    token = auth_service.create_access_token(str(user.id))
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@router.post("/login", response_model=TokenResponse)
async def login(
    data: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    user, token = await auth_service.login(db, data.email, data.password)
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@router.get("/me", response_model=MeResponse)
async def me(current_user: User = Depends(get_current_user)):
    return MeResponse.model_validate(current_user)
