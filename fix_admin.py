from passlib.context import CryptContext
from sqlalchemy import create_engine, text

pwd = CryptContext(schemes=["bcrypt"]).hash("Aidep@Admin2025!")
engine = create_engine("postgresql://aidep_user:aidep_pass_2026@db:5432/aidep")
with engine.connect() as conn:
    conn.execute(
        text("UPDATE users SET password_hash=:h WHERE email='admin@aidep.gov.tr'"),
        {"h": pwd}
    )
    conn.commit()
print("OK:", pwd[:30], "...")
