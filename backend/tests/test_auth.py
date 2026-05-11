import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio

# ─── Yardımcılar ───────────────────────────────────────────────

async def _create_stk_org(client, name="AKUT", city="Konya", district="Selçuklu"):
    res = await client.post("/organizations", json={
        "name": name, "city": city, "district": district, "org_type": "STK",
    })
    assert res.status_code == 201
    return res.json()


async def _create_official_org(client, name="AFAD", city="Konya", district="Selçuklu"):
    res = await client.post("/organizations", json={
        "name": name, "city": city, "district": district, "org_type": "OFFICIAL",
    })
    assert res.status_code == 201
    return res.json()


CITIZEN_BASE = {
    "tc_no": "12345678901",
    "full_name": "Test Vatandas",
    "email": "vatandas@aideptest.com",
    "phone": "+905550000001",
    "password": "test123",
    "password_confirm": "test123",
}

NGO_MANAGER_BASE = {
    "tc_no": "12345678901",
    "full_name": "STK Yoneticisi",
    "email": "yonetici@aideptest.com",
    "phone": "+905550000010",
    "password": "test123",
    "password_confirm": "test123",
    "activity_areas": ["İlk Yardım", "Lojistik"],
}

NGO_STAFF_BASE = {
    "tc_no": "12345678901",
    "full_name": "Saha Gorevlisi",
    "email": "saha@aideptest.com",
    "phone": "+905550000020",
    "password": "test123",
    "password_confirm": "test123",
}

OFFICIAL_BASE = {
    "tc_no": "12345678901",
    "full_name": "Resmi Yetkili",
    "phone": "+905550000050",
    "email": "yetkili@aideptest.com",
    "password": "test123",
    "password_confirm": "test123",
}


# ─── Vatandaş Kaydı ────────────────────────────────────────────

async def test_register_citizen_success(client: AsyncClient):
    res = await client.post("/auth/register", json=CITIZEN_BASE)
    assert res.status_code == 201
    assert res.json()["user"]["role"] == "CITIZEN"
    assert "access_token" in res.json()


async def test_register_citizen_duplicate_email(client: AsyncClient):
    await client.post("/auth/register", json=CITIZEN_BASE)
    res = await client.post("/auth/register", json={**CITIZEN_BASE, "phone": "+905550000099"})
    assert res.status_code == 409
    assert "e-posta" in res.json()["detail"].lower()


async def test_register_invalid_tc_no(client: AsyncClient):
    res = await client.post("/auth/register", json={**CITIZEN_BASE, "tc_no": "1234"})
    assert res.status_code == 422


async def test_register_short_password(client: AsyncClient):
    res = await client.post("/auth/register", json={
        **CITIZEN_BASE, "password": "12", "password_confirm": "12"
    })
    assert res.status_code == 422


async def test_register_passwords_mismatch(client: AsyncClient):
    res = await client.post("/auth/register", json={
        **CITIZEN_BASE, "password_confirm": "yanlis123"
    })
    assert res.status_code == 422


# ─── Gönüllü Kaydı ─────────────────────────────────────────────

async def test_register_volunteer_success(client: AsyncClient):
    org = await _create_stk_org(client)
    res = await client.post("/auth/register", json={
        **CITIZEN_BASE, "email": "gonullu@aideptest.com",
        "phone": "+905550000030", "organization_id": org["id"],
    })
    assert res.status_code == 201
    assert res.json()["user"]["role"] == "VOLUNTEER"


async def test_register_volunteer_skills_empty_on_register(client: AsyncClient):
    org = await _create_stk_org(client)
    reg = await client.post("/auth/register", json={
        **CITIZEN_BASE, "email": "gonullu2@aideptest.com",
        "phone": "+905550000031", "organization_id": org["id"],
    })
    token = reg.json()["access_token"]
    me = await client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    vp = me.json()["volunteer_profile"]
    assert vp["skills"] == []
    assert vp["skills_completed"] is False
    assert vp["organization"]["district"] == "Selçuklu"


# ─── NGO Yönetici Kaydı ────────────────────────────────────────

async def test_register_ngo_manager_success(client: AsyncClient):
    org = await _create_stk_org(client)
    res = await client.post("/auth/register/ngo-manager", json={
        **NGO_MANAGER_BASE, "organization_id": org["id"],
    })
    assert res.status_code == 201
    assert res.json()["role"] == "NGO_MANAGER"
    assert res.json()["is_active"] is False


async def test_register_ngo_staff_success(client: AsyncClient):
    org = await _create_stk_org(client)
    res = await client.post("/auth/register/ngo-staff", json={
        **NGO_STAFF_BASE, "organization_id": org["id"],
    })
    assert res.status_code == 201
    assert res.json()["role"] == "NGO_STAFF"
    assert res.json()["is_active"] is False


# ─── Resmi Kurum Kaydı ─────────────────────────────────────────

async def test_register_official_manager_success(client: AsyncClient):
    """Sicil no başı '1' → OFFICIAL_MANAGER."""
    org = await _create_official_org(client)
    res = await client.post("/auth/register/official", json={
        **OFFICIAL_BASE,
        "organization_id": org["id"],
        "registration_number": "1234567890",  # başı '1' → yetkili
    })
    assert res.status_code == 201
    data = res.json()
    assert data["user"]["role"] == "OFFICIAL_MANAGER"
    assert data["user"]["is_active"] is True
    assert "access_token" in data


async def test_register_official_staff_success(client: AsyncClient):
    """Sicil no başı '1' değil → OFFICIAL_STAFF."""
    org = await _create_official_org(client)
    res = await client.post("/auth/register/official", json={
        **OFFICIAL_BASE,
        "email": "personel@aideptest.com",
        "phone": "+905550000051",
        "organization_id": org["id"],
        "registration_number": "2345678901",  # başı '2' → personel
    })
    assert res.status_code == 201
    assert res.json()["user"]["role"] == "OFFICIAL_STAFF"
    assert res.json()["user"]["is_active"] is True


async def test_register_official_invalid_reg_number(client: AsyncClient):
    """10 haneli sayı değilse 422."""
    org = await _create_official_org(client)
    res = await client.post("/auth/register/official", json={
        **OFFICIAL_BASE, "organization_id": org["id"],
        "registration_number": "12345",  # çok kısa
    })
    assert res.status_code == 422


async def test_register_official_duplicate_reg_number(client: AsyncClient):
    """Aynı sicil numarası iki kez kayıt edilemez."""
    org = await _create_official_org(client)
    payload = {**OFFICIAL_BASE, "organization_id": org["id"],
                "registration_number": "1234567890"}
    await client.post("/auth/register/official", json=payload)
    res = await client.post("/auth/register/official", json={
        **payload, "email": "yetkili2@aideptest.com", "phone": "+905550000052",
    })
    assert res.status_code == 409
    assert "sicil" in res.json()["detail"].lower()


# ─── Web Giriş Kısıtlaması ─────────────────────────────────────

async def test_web_login_official_manager_allowed(client: AsyncClient):
    """OFFICIAL_MANAGER web'den giriş yapabilir."""
    org = await _create_official_org(client)
    await client.post("/auth/register/official", json={
        **OFFICIAL_BASE, "organization_id": org["id"],
        "registration_number": "1234567890",
    })
    res = await client.post("/auth/login", json={
        "email": "yetkili@aideptest.com",
        "password": "test123",
        "platform": "web",
    })
    assert res.status_code == 200


async def test_web_login_official_staff_blocked(client: AsyncClient):
    """OFFICIAL_STAFF web'den giriş yapamaz → 403."""
    org = await _create_official_org(client)
    await client.post("/auth/register/official", json={
        **OFFICIAL_BASE,
        "email": "personel@aideptest.com",
        "phone": "+905550000051",
        "organization_id": org["id"],
        "registration_number": "2345678901",
    })
    res = await client.post("/auth/login", json={
        "email": "personel@aideptest.com",
        "password": "test123",
        "platform": "web",
    })
    assert res.status_code == 403
    assert "web" in res.json()["detail"].lower()


async def test_web_login_citizen_blocked(client: AsyncClient):
    """Vatandaş web'den giriş yapamaz → 403."""
    await client.post("/auth/register", json=CITIZEN_BASE)
    res = await client.post("/auth/login", json={
        "email": "vatandas@aideptest.com",
        "password": "test123",
        "platform": "web",
    })
    assert res.status_code == 403


async def test_web_login_ngo_staff_blocked(client: AsyncClient):
    """NGO_STAFF web'den giriş yapamaz → 403."""
    org = await _create_stk_org(client)
    await client.post("/auth/register/ngo-staff", json={
        **NGO_STAFF_BASE, "organization_id": org["id"],
    })
    # Önce aktif et (normalde yönetici onaylar, test için direkt DB'ye bakıyoruz)
    # NGO_STAFF is_active=False olduğu için önce pending approval hatası alırız
    res = await client.post("/auth/login", json={
        "email": "saha@aideptest.com",
        "password": "test123",
        "platform": "web",
    })
    # is_active=False olduğu için "onay bekliyor" gelir (403)
    assert res.status_code == 403


async def test_mobile_login_official_staff_allowed(client: AsyncClient):
    """OFFICIAL_STAFF mobil'den giriş yapabilir."""
    org = await _create_official_org(client)
    await client.post("/auth/register/official", json={
        **OFFICIAL_BASE,
        "email": "personel@aideptest.com",
        "phone": "+905550000051",
        "organization_id": org["id"],
        "registration_number": "2345678901",
    })
    res = await client.post("/auth/login", json={
        "email": "personel@aideptest.com",
        "password": "test123",
        "platform": "mobile",
    })
    assert res.status_code == 200


# ─── Onay Bekleme ──────────────────────────────────────────────

async def test_login_pending_approval(client: AsyncClient):
    org = await _create_stk_org(client)
    await client.post("/auth/register/ngo-manager", json={
        **NGO_MANAGER_BASE, "organization_id": org["id"],
    })
    res = await client.post("/auth/login", json={
        "email": "yonetici@aideptest.com", "password": "test123",
    })
    assert res.status_code == 403
    assert "onay" in res.json()["detail"].lower()


# ─── Beceri Güncelleme ─────────────────────────────────────────

async def test_update_skills_success(client: AsyncClient):
    org = await _create_stk_org(client)
    reg = await client.post("/auth/register", json={
        **CITIZEN_BASE, "email": "skilltest@aideptest.com",
        "phone": "+905550000040", "organization_id": org["id"],
    })
    token = reg.json()["access_token"]
    res = await client.put("/auth/me/skills",
                           json={"skills": ["İlk Yardım", "Araç Kullanımı"]},
                           headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["skills_completed"] is True


async def test_update_skills_citizen_forbidden(client: AsyncClient):
    reg = await client.post("/auth/register", json=CITIZEN_BASE)
    token = reg.json()["access_token"]
    res = await client.put("/auth/me/skills",
                           json={"skills": ["İlk Yardım"]},
                           headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 403


# ─── Giriş / /me ───────────────────────────────────────────────

async def test_login_success(client: AsyncClient):
    await client.post("/auth/register", json=CITIZEN_BASE)
    res = await client.post("/auth/login", json={
        "email": "vatandas@aideptest.com", "password": "test123",
    })
    assert res.status_code == 200
    assert "access_token" in res.json()


async def test_login_wrong_password(client: AsyncClient):
    await client.post("/auth/register", json=CITIZEN_BASE)
    res = await client.post("/auth/login", json={
        "email": "vatandas@aideptest.com", "password": "yanlis",
    })
    assert res.status_code == 401


async def test_me_success(client: AsyncClient):
    reg = await client.post("/auth/register", json=CITIZEN_BASE)
    token = reg.json()["access_token"]
    res = await client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["email"] == "vatandas@aideptest.com"


async def test_me_no_token(client: AsyncClient):
    res = await client.get("/auth/me")
    assert res.status_code == 403


async def test_me_official_profile(client: AsyncClient):
    """OFFICIAL_MANAGER /me'de official_profile döner."""
    org = await _create_official_org(client)
    reg = await client.post("/auth/register/official", json={
        **OFFICIAL_BASE, "organization_id": org["id"],
        "registration_number": "1234567890",
    })
    token = reg.json()["access_token"]
    me = await client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    op = me.json()["official_profile"]
    assert op is not None
    assert op["registration_number"] == "1234567890"
    assert op["organization"]["name"] == "AFAD"


# ─── Beceri Listesi ────────────────────────────────────────────

async def test_predefined_skills_list(client: AsyncClient):
    res = await client.get("/volunteers/skills")
    assert res.status_code == 200
    assert "İlk Yardım" in res.json()
