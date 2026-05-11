import psycopg2
from core.config import settings

conn = psycopg2.connect(settings.DATABASE_URL)
cur = conn.cursor()

cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='organizations'")
print("organizations:", [r[0] for r in cur.fetchall()])

cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='official_profiles'")
print("official_profiles:", [r[0] for r in cur.fetchall()])

cur.execute("SELECT enum_range(NULL::orgtype)")
print("orgtype values:", cur.fetchone())

cur.execute("SELECT enum_range(NULL::userrole)")
print("userrole values:", cur.fetchone())

cur.close()
conn.close()
