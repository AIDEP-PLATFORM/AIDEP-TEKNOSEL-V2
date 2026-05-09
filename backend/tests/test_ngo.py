import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


async def test_list_ngos_empty(client: AsyncClient):
    res = await client.get("/ngos")
    assert res.status_code == 200
    assert isinstance(res.json(), list)


async def test_list_ngos_after_register(client: AsyncClient):
    await client.post("/auth/register/ngo", json={
        "email": "listtest@aideptest.com",
        "phone": "+905550000050",
        "password": "test123",
        "full_name": "STK Yetkili",
        "organization_name": "Kizilav Test",
        "authorization_number": "STK-LIST-001",
    })
    res = await client.get("/ngos")
    assert res.status_code == 200
    names = [n["organization_name"] for n in res.json()]
    assert "Kizilav Test" in names


async def test_ngo_list_item_has_id_and_name(client: AsyncClient):
    await client.post("/auth/register/ngo", json={
        "email": "fields@aideptest.com",
        "phone": "+905550000051",
        "password": "test123",
        "full_name": "STK Yetkili",
        "organization_name": "Fields Test STK",
        "authorization_number": "STK-FIELDS-001",
    })
    res = await client.get("/ngos")
    item = next((n for n in res.json() if n["organization_name"] == "Fields Test STK"), None)
    assert item is not None
    assert "id" in item
    assert "organization_name" in item
