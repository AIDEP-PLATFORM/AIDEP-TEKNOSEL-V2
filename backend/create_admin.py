import asyncio, uuid, os
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

pwd = CryptContext(schemes=["bcrypt"]).hash("Aidep@Admin2025!")
db_url = os.environ.get("DATABASE_URL_ASYNC")
user_id = str(uuid.uuid4())

async def run():
    engine = create_async_engine(db_url)
    async with engine.begin() as conn:
        await conn.execute(text("""
            INSERT INTO users (id, email, phone, password_hash, full_name, tc_no, role, is_active, created_at, updated_at)
            VALUES (:id, 'admin@aidep.gov.tr', '05000000000', :pwd, 'Süper Admin', '00000000000', 'ADMIN', true, now(), now())
            ON CONFLICT (email) DO UPDATE SET password_hash = :pwd, role = 'ADMIN', is_active = true
        """), {"id": user_id, "pwd": pwd})
    print("Admin kullanici olusturuldu/guncellendi.")

asyncio.run(run())
