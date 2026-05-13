"""
Firebase Realtime Database ve FCM istemcisi.

Emülatör modunda (FIREBASE_EMULATOR=True):
  - Realtime DB için doğrudan HTTP REST API kullanılır (auth yok)
  - FCM bildirimleri loglanır (gerçek gönderim yok)

Production modunda:
  - firebase-admin SDK kullanılır
  - FCM server key ile bildirim gönderilir
"""
import logging
import httpx

from core.config import settings

logger = logging.getLogger(__name__)

# ─── Realtime Database ──────────────────────────────────────────

def _db_url(path: str) -> str:
    """Firebase Realtime DB REST endpoint'i oluştur."""
    base = settings.FIREBASE_DATABASE_URL.rstrip("/")
    project = settings.FIREBASE_PROJECT_ID
    # Emülatör: http://firebase:9000/<path>.json?ns=<project>
    # Production: https://<project>.firebaseio.com/<path>.json
    if settings.FIREBASE_EMULATOR:
        return f"{base}/{path}.json?ns={project}"
    return f"https://{project}.firebaseio.com/{path}.json"


async def db_set(path: str, data: dict) -> None:
    """Firebase DB'ye veri yaz (PUT = üzerine yaz)."""
    url = _db_url(path)
    async with httpx.AsyncClient(timeout=5.0) as client:
        resp = await client.put(url, json=data)
        if resp.status_code not in (200, 204):
            logger.warning("Firebase DB PUT failed: %s %s", resp.status_code, resp.text)


async def db_get(path: str) -> dict | None:
    """Firebase DB'den veri oku."""
    url = _db_url(path)
    async with httpx.AsyncClient(timeout=5.0) as client:
        resp = await client.get(url)
        if resp.status_code == 200:
            return resp.json()
        logger.warning("Firebase DB GET failed: %s", resp.status_code)
        return None


async def db_delete(path: str) -> None:
    """Firebase DB'den veri sil."""
    url = _db_url(path)
    async with httpx.AsyncClient(timeout=5.0) as client:
        await client.delete(url)


# ─── FCM (Push Notification) ────────────────────────────────────

async def send_fcm(token: str, title: str, body: str, data: dict | None = None) -> None:
    """
    FCM push bildirimi gönder.
    Emülatör modunda yalnızca loglanır.
    """
    payload = {
        "notification": {"title": title, "body": body},
        "data": data or {},
        "token": token,
    }

    if settings.FIREBASE_EMULATOR:
        logger.info("[FCM EMULATOR] → %s | %s: %s | data=%s", token[:20], title, body, data)
        return

    if not settings.FCM_SERVER_KEY:
        logger.warning("FCM_SERVER_KEY not set, skipping notification")
        return

    headers = {
        "Authorization": f"key={settings.FCM_SERVER_KEY}",
        "Content-Type": "application/json",
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                "https://fcm.googleapis.com/fcm/send",
                json={"to": token, "notification": payload["notification"], "data": data or {}},
                headers=headers,
            )
            if resp.status_code != 200:
                logger.warning("FCM send failed: %s %s", resp.status_code, resp.text)
            else:
                logger.info("FCM sent to token %s...", token[:20])
    except Exception as exc:
        logger.error("FCM exception: %s", exc)
