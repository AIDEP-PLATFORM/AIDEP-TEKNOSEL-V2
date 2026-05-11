import os
import pytest
import pytest_asyncio
import psycopg2
from httpx import AsyncClient, ASGITransport
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
        base_url="http://test",
    ) as ac:
        yield ac
    _sync_cleanup()


@pytest.fixture(autouse=True)
def cleanup_between_tests():
    _sync_cleanup()
    yield
