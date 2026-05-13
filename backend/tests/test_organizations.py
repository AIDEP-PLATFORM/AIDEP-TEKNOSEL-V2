import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


async def test_create_stk_organization(client: AsyncClient, admin_headers):
    res = await client.post("/organizations", json={
        "name": "AKUT", "city": "Konya", "district": "Selçuklu", "org_type": "STK",
    }, headers=admin_headers)
    assert res.status_code == 201
    assert res.json()["org_type"] == "STK"


async def test_create_official_organization(client: AsyncClient, admin_headers):
    res = await client.post("/organizations", json={
        "name": "AFAD", "city": "Konya", "district": "Selçuklu", "org_type": "OFFICIAL",
    }, headers=admin_headers)
    assert res.status_code == 201
    assert res.json()["org_type"] == "OFFICIAL"


async def test_create_organization_requires_admin(client: AsyncClient):
    """Admin olmadan kurum oluşturulamaz → 403."""
    res = await client.post("/organizations", json={
        "name": "AKUT", "city": "Konya", "district": "Selçuklu", "org_type": "STK",
    })
    assert res.status_code == 403


async def test_same_name_different_type_allowed(client: AsyncClient, admin_headers):
    """Aynı isim STK ve OFFICIAL olarak ayrı kaydedilebilir."""
    await client.post("/organizations", json={
        "name": "Kızılay", "city": "Konya", "district": "Selçuklu", "org_type": "STK",
    }, headers=admin_headers)
    res = await client.post("/organizations", json={
        "name": "Kızılay", "city": "Konya", "district": "Selçuklu", "org_type": "OFFICIAL",
    }, headers=admin_headers)
    assert res.status_code == 201


async def test_duplicate_same_type_blocked(client: AsyncClient, admin_headers):
    payload = {"name": "AKUT", "city": "Konya", "district": "Selçuklu", "org_type": "STK"}
    await client.post("/organizations", json=payload, headers=admin_headers)
    res = await client.post("/organizations", json=payload, headers=admin_headers)
    assert res.status_code == 409


async def test_list_filter_by_type(client: AsyncClient, admin_headers):
    await client.post("/organizations", json={
        "name": "AKUT", "city": "Konya", "district": "Selçuklu", "org_type": "STK",
    }, headers=admin_headers)
    await client.post("/organizations", json={
        "name": "AFAD", "city": "Konya", "district": "Selçuklu", "org_type": "OFFICIAL",
    }, headers=admin_headers)
    stk_res = await client.get("/organizations?org_type=STK")
    official_res = await client.get("/organizations?org_type=OFFICIAL")

    stk_names = [o["name"] for o in stk_res.json()]
    official_names = [o["name"] for o in official_res.json()]

    assert "AKUT" in stk_names
    assert "AFAD" not in stk_names
    assert "AFAD" in official_names
    assert "AKUT" not in official_names


async def test_names_filter_by_type(client: AsyncClient, admin_headers):
    await client.post("/organizations", json={
        "name": "AKUT", "city": "Konya", "district": "Selçuklu", "org_type": "STK",
    }, headers=admin_headers)
    await client.post("/organizations", json={
        "name": "AFAD", "city": "Konya", "district": "Selçuklu", "org_type": "OFFICIAL",
    }, headers=admin_headers)
    res = await client.get("/organizations/names?org_type=OFFICIAL")
    names = res.json()
    assert "AFAD" in names
    assert "AKUT" not in names


async def test_cascade_dropdown(client: AsyncClient, admin_headers):
    """STK → il → ilçe cascade dropdown testi."""
    await client.post("/organizations", json={
        "name": "AKUT", "city": "Konya", "district": "Selçuklu", "org_type": "STK",
    }, headers=admin_headers)
    await client.post("/organizations", json={
        "name": "AKUT", "city": "Konya", "district": "Meram", "org_type": "STK",
    }, headers=admin_headers)
    await client.post("/organizations", json={
        "name": "AKUT", "city": "İstanbul", "district": "Kadıköy", "org_type": "STK",
    }, headers=admin_headers)

    names = (await client.get("/organizations/names?org_type=STK")).json()
    assert names.count("AKUT") == 1

    cities = (await client.get("/organizations/cities?name=AKUT&org_type=STK")).json()
    assert "Konya" in cities and "İstanbul" in cities

    branches = (await client.get(
        "/organizations/branches?name=AKUT&city=Konya&org_type=STK"
    )).json()
    districts = [b["district"] for b in branches]
    assert "Selçuklu" in districts and "Meram" in districts
    assert "Kadıköy" not in districts
