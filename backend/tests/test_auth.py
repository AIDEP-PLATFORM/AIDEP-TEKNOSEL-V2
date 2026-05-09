import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


# ─── Vatandaş Kaydı ────────────────────────────────────────────

async def test_register_citizen_success(client: AsyncClient):
    res = await client.post("/auth/register/citizen", json={
        "email": "vatandas@aideptest.com",
        "phone": "+905550000001",
        "password": "test123",
        "full_name": "Test Vatandas",
    })
    assert res.status_code == 201
    data = res.json()
    assert "access_token" in data
    assert data["user"]["role"] == "CITIZEN"
    assert data["user"]["email"] == "vatandas@aideptest.com"


async def test_register_citizen_duplicate_email(client: AsyncClient):
    payload = {
        "email": "duplicate@aideptest.com",
        "phone": "+905550000002",
        "password": "test123",
        "full_name": "Test Kullanici",
    }
    await client.post("/auth/register/citizen", json=payload)
    res = await client.post("/auth/register/citizen", json={**payload, "phone": "+905550000099"})
    assert res.status_code == 409
    assert "e-posta" in res.json()["detail"].lower()


async def test_register_citizen_duplicate_phone(client: AsyncClient):
    payload = {
        "email": "phone1@aideptest.com",
        "phone": "+905550000003",
        "password": "test123",
        "full_name": "Test Kullanici",
    }
    await client.post("/auth/register/citizen", json=payload)
    res = await client.post("/auth/register/citizen", json={**payload, "email": "phone2@aideptest.com"})
    assert res.status_code == 409
    assert "telefon" in res.json()["detail"].lower()


async def test_register_citizen_short_password(client: AsyncClient):
    res = await client.post("/auth/register/citizen", json={
        "email": "short@aideptest.com",
        "phone": "+905550000004",
        "password": "12",
        "full_name": "Test",
    })
    assert res.status_code == 422


async def test_register_citizen_invalid_phone(client: AsyncClient):
    res = await client.post("/auth/register/citizen", json={
        "email": "phone@aideptest.com",
        "phone": "05550000005",  # + ile başlamıyor
        "password": "test123",
        "full_name": "Test",
    })
    assert res.status_code == 422


# ─── STK Kaydı ─────────────────────────────────────────────────

async def test_register_ngo_success(client: AsyncClient):
    res = await client.post("/auth/register/ngo", json={
        "email": "ngo@aideptest.com",
        "phone": "+905550000010",
        "password": "test123",
        "full_name": "STK Yetkili",
        "organization_name": "Test STK",
        "authorization_number": "STK-TEST-001",
    })
    assert res.status_code == 201
    data = res.json()
    assert data["user"]["role"] == "NGO"


async def test_register_ngo_duplicate_auth_number(client: AsyncClient):
    payload = {
        "email": "ngo1@aideptest.com",
        "phone": "+905550000011",
        "password": "test123",
        "full_name": "STK Yetkili",
        "organization_name": "Test STK",
        "authorization_number": "STK-TEST-DUP",
    }
    await client.post("/auth/register/ngo", json=payload)
    res = await client.post("/auth/register/ngo", json={
        **payload,
        "email": "ngo2@aideptest.com",
        "phone": "+905550000012",
    })
    assert res.status_code == 409
    assert "yetki numarası" in res.json()["detail"].lower()


# ─── Gönüllü Kaydı ─────────────────────────────────────────────

async def test_register_volunteer_success(client: AsyncClient):
    res = await client.post("/auth/register/volunteer", json={
        "email": "gonullu@aideptest.com",
        "phone": "+905550000020",
        "password": "test123",
        "full_name": "Test Gonullu",
        "skills": ["ilk yardim", "arac kullanimi"],
    })
    assert res.status_code == 201
    data = res.json()
    assert data["user"]["role"] == "VOLUNTEER"


async def test_register_volunteer_with_ngo(client: AsyncClient):
    # Önce STK oluştur
    ngo_res = await client.post("/auth/register/ngo", json={
        "email": "ngo_for_vol@aideptest.com",
        "phone": "+905550000021",
        "password": "test123",
        "full_name": "STK Yetkili",
        "organization_name": "AKUT Test",
        "authorization_number": "STK-TEST-VOL",
    })
    assert ngo_res.status_code == 201

    # NGO profile id'yi al
    ngos = await client.get("/ngos")
    akut = next((n for n in ngos.json() if n["organization_name"] == "AKUT Test"), None)
    assert akut is not None

    # Gönüllüyü AKUT'a bağla
    res = await client.post("/auth/register/volunteer", json={
        "email": "gonullu_akut@aideptest.com",
        "phone": "+905550000022",
        "password": "test123",
        "full_name": "AKUT Gonullu",
        "skills": ["enkaz"],
        "preferred_ngo_id": akut["id"],
    })
    assert res.status_code == 201


# ─── Giriş ─────────────────────────────────────────────────────

async def test_login_success(client: AsyncClient):
    await client.post("/auth/register/citizen", json={
        "email": "login@aideptest.com",
        "phone": "+905550000030",
        "password": "test123",
        "full_name": "Login Test",
    })
    res = await client.post("/auth/login", json={
        "email": "login@aideptest.com",
        "password": "test123",
    })
    assert res.status_code == 200
    assert "access_token" in res.json()


async def test_login_wrong_password(client: AsyncClient):
    await client.post("/auth/register/citizen", json={
        "email": "wrongpass@aideptest.com",
        "phone": "+905550000031",
        "password": "test123",
        "full_name": "Test",
    })
    res = await client.post("/auth/login", json={
        "email": "wrongpass@aideptest.com",
        "password": "yanlis_sifre",
    })
    assert res.status_code == 401


async def test_login_nonexistent_user(client: AsyncClient):
    res = await client.post("/auth/login", json={
        "email": "yok@aideptest.com",
        "password": "test123",
    })
    assert res.status_code == 401


# ─── /me ───────────────────────────────────────────────────────

async def test_me_success(client: AsyncClient):
    reg = await client.post("/auth/register/citizen", json={
        "email": "me@aideptest.com",
        "phone": "+905550000040",
        "password": "test123",
        "full_name": "Me Test",
    })
    token = reg.json()["access_token"]
    res = await client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["email"] == "me@aideptest.com"


async def test_me_no_token(client: AsyncClient):
    res = await client.get("/auth/me")
    assert res.status_code == 403


async def test_me_invalid_token(client: AsyncClient):
    res = await client.get("/auth/me", headers={"Authorization": "Bearer gecersiz_token"})
    assert res.status_code == 401
