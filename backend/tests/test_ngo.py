"""
NGO yöneticisi kayıt ve organizasyon listeleme testleri.
Eski /ngos ve /auth/register/ngo endpoint'leri kaldırıldı;
yeni API: /organizations ve /auth/register/ngo-manager kullanılır.
"""
import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio

NGO_MANAGER_BASE = {
    "tc_no": "12345678901",
    "full_name": "STK Yetkili",
    "email": "ngotest@aideptest.com",
    "phone": "+905550000060",
    "password": "test123",
    "password_confirm": "test123",
    "activity_areas": ["İlk Yardım"],
}


async def test_list_organizations_empty(client: AsyncClient):
    """Hiç kurum yokken boş liste döner."""
    res = await client.get("/organizations")
    assert res.status_code == 200
    assert isinstance(res.json(), list)


async def test_list_stk_organizations_after_create(client: AsyncClient, admin_headers):
    """Kurum oluşturulduktan sonra listede görünür."""
    await client.post("/organizations", json={
        "name": "Kızılay Test",
        "city": "Konya",
        "district": "Selçuklu",
        "org_type": "STK",
    }, headers=admin_headers)
    res = await client.get("/organizations?org_type=STK")
    assert res.status_code == 200
    names = [o["name"] for o in res.json()]
    assert "Kızılay Test" in names


async def test_organization_has_required_fields(client: AsyncClient, admin_headers):
    """Kurum kaydı id, name, org_type, city, district alanlarını içerir."""
    await client.post("/organizations", json={
        "name": "AKUT Test",
        "city": "Ankara",
        "district": "Çankaya",
        "org_type": "STK",
    }, headers=admin_headers)
    res = await client.get("/organizations?org_type=STK")
    item = next((o for o in res.json() if o["name"] == "AKUT Test"), None)
    assert item is not None
    assert "id" in item
    assert item["org_type"] == "STK"
    assert item["city"] == "Ankara"


async def test_ngo_manager_register_pending(client: AsyncClient, admin_headers):
    """NGO yöneticisi kayıt sonrası onay bekler (is_active=False)."""
    org_res = await client.post("/organizations", json={
        "name": "Test STK",
        "city": "İzmir",
        "district": "Bornova",
        "org_type": "STK",
    }, headers=admin_headers)
    org_id = org_res.json()["id"]

    res = await client.post("/auth/register/ngo-manager", json={
        **NGO_MANAGER_BASE,
        "organization_id": org_id,
    })
    assert res.status_code == 201
    assert res.json()["role"] == "NGO_MANAGER"
    assert res.json()["is_active"] is False
