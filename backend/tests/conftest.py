import os
import uuid

import psycopg2
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "../../.env"))

from core.config import settings
from core.database import get_db
from main import app

test_engine = create_async_engine(settings.DATABASE_URL_ASYNC, echo=False)
TestSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

_pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def override_get_db():
    async with TestSessionLocal() as session:
        yield session


app.dependency_overrides[get_db] = override_get_db


def _sync_cleanup():
    """Test verilerini psycopg2 ile temizle."""
    conn = psycopg2.connect(settings.DATABASE_URL)
    conn.autocommit = True
    cur = conn.cursor()

    test_filter = "user_id IN (SELECT id FROM users WHERE email LIKE '%@aideptest.com')"
    cur.execute(f"DELETE FROM volunteer_profiles WHERE {test_filter}")
    cur.execute(f"DELETE FROM ngo_manager_profiles WHERE {test_filter}")
    cur.execute(f"DELETE FROM ngo_staff_profiles WHERE {test_filter}")
    cur.execute(f"DELETE FROM official_profiles WHERE {test_filter}")
    cur.execute("DELETE FROM users WHERE email LIKE '%@aideptest.com'")
    cur.execute("DELETE FROM organizations")

    cur.close()
    conn.close()


@pytest_asyncio.fixture(scope="session")
async def client():
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test/api/v1",
    ) as ac:
        yield ac
    _sync_cleanup()


@pytest.fixture(autouse=True)
def cleanup_between_tests():
    _sync_cleanup()
    yield


@pytest_asyncio.fixture
async def admin_headers():
    """Her test için ADMIN kullanıcı oluşturur ve Authorization header'ı döner.
    Kullanıcı %@aideptest.com pattern'ına uyduğundan cleanup otomatik çalışır.
    """
    from models.user import User, UserRole
    from services.auth_service import create_access_token

    admin_id = uuid.uuid4()
    async with TestSessionLocal() as db:
        admin = User(
            id=admin_id,
            full_name="Test Admin",
            email="testadmin@aideptest.com",
            phone="+905559999900",
            tc_no="99999999901",
            password_hash=_pwd.hash("admin123"),
            role=UserRole.ADMIN,
            is_active=True,
        )
        db.add(admin)
        await db.commit()

    token = create_access_token(str(admin_id))
    return {"Authorization": f"Bearer {token}"}
