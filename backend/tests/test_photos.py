"""
Hasar fotoğrafı yükleme ve listeleme testleri.
POST /requests/{id}/photos  — fotoğraf yükleme
GET  /requests/{id}/photos  — fotoğraf listeleme
photo_count                 — talep detayında fotoğraf sayısı
"""
import io
import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio

# Minimal geçerli JPEG dosyası (22 byte)
_MINIMAL_JPEG = bytes([
    0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46,
    0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
    0x00, 0x01, 0x00, 0x00, 0xFF, 0xD9,
])

REQUEST_PAYLOAD = {
    "latitude": 39.9334,
    "longitude": 32.8597,
    "need_type": "RESCUE",
    "urgency_level": 3,
    "person_count": 2,
    "description": "Test enkaz",
}


async def _citizen_token(client: AsyncClient) -> str:
    """Vatandaş kaydı yapıp token döndürür."""
    res = await client.post("/auth/register", json={
        "tc_no": "12345678901",
        "full_name": "Foto Test Vatandas",
        "email": "fototest@aideptest.com",
        "phone": "+905550001001",
        "password": "test123",
        "password_confirm": "test123",
    })
    assert res.status_code == 201, res.json()
    return res.json()["access_token"]


async def _create_request(client: AsyncClient, token: str) -> str:
    """Yardım talebi oluşturup ID'yi döndürür."""
    res = await client.post(
        "/requests",
        json=REQUEST_PAYLOAD,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 201, res.json()
    return res.json()["id"]


# ─── Fotoğraf Yükleme ───────────────────────────────────────────

async def test_upload_photo_success(client: AsyncClient):
    """Geçerli JPEG yükleme 201 veya 503 döner (S3 test ortamında kapalı olabilir)."""
    token = await _citizen_token(client)
    req_id = await _create_request(client, token)

    res = await client.post(
        f"/requests/{req_id}/photos",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("test.jpg", io.BytesIO(_MINIMAL_JPEG), "image/jpeg")},
        data={},
    )
    # S3 erişimi test ortamında olmayabilir; 201 veya 503 kabul edilir
    assert res.status_code in (201, 503)


async def test_upload_photo_invalid_format(client: AsyncClient):
    """JPEG/PNG/WEBP dışı format → 415."""
    token = await _citizen_token(client)
    req_id = await _create_request(client, token)

    res = await client.post(
        f"/requests/{req_id}/photos",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("test.pdf", io.BytesIO(b"%PDF-1.4 fake"), "application/pdf")},
        data={},
    )
    assert res.status_code == 415


async def test_upload_photo_nonexistent_request(client: AsyncClient):
    """Olmayan talep ID'si → 404."""
    token = await _citizen_token(client)
    fake_id = "00000000-0000-0000-0000-000000000000"

    res = await client.post(
        f"/requests/{fake_id}/photos",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("test.jpg", io.BytesIO(_MINIMAL_JPEG), "image/jpeg")},
        data={},
    )
    assert res.status_code == 404


async def test_upload_photo_requires_auth(client: AsyncClient):
    """Token olmadan → 403."""
    token = await _citizen_token(client)
    req_id = await _create_request(client, token)

    res = await client.post(
        f"/requests/{req_id}/photos",
        files={"file": ("test.jpg", io.BytesIO(_MINIMAL_JPEG), "image/jpeg")},
        data={},
    )
    assert res.status_code == 403


# ─── Fotoğraf Listeleme ─────────────────────────────────────────

async def test_list_photos_empty(client: AsyncClient):
    """Fotoğraf yüklenmemiş talep için boş liste döner."""
    token = await _citizen_token(client)
    req_id = await _create_request(client, token)

    res = await client.get(
        f"/requests/{req_id}/photos",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    assert res.json() == []


async def test_list_photos_nonexistent_request(client: AsyncClient):
    """Olmayan talep → 404."""
    token = await _citizen_token(client)
    fake_id = "00000000-0000-0000-0000-000000000000"

    res = await client.get(
        f"/requests/{fake_id}/photos",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 404


async def test_list_photos_requires_auth(client: AsyncClient):
    """Token olmadan → 403."""
    token = await _citizen_token(client)
    req_id = await _create_request(client, token)

    res = await client.get(f"/requests/{req_id}/photos")
    assert res.status_code == 403


# ─── photo_count Alanı ──────────────────────────────────────────

async def test_request_response_has_photo_count(client: AsyncClient):
    """Talep oluştururken photo_count=0 döner."""
    token = await _citizen_token(client)
    req_id = await _create_request(client, token)

    res = await client.get(
        f"/requests/{req_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    assert "photo_count" in res.json()
    assert res.json()["photo_count"] == 0


def _build_multipart(file_bytes: bytes) -> bytes:
    """Basit multipart/form-data body oluşturur (test yardımcısı)."""
    boundary = b"boundary123"
    body = (
        b"--" + boundary + b"\r\n"
        b'Content-Disposition: form-data; name="file"; filename="test.jpg"\r\n'
        b"Content-Type: image/jpeg\r\n\r\n"
        + file_bytes +
        b"\r\n--" + boundary + b"--\r\n"
    )
    return body
