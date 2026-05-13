"""add_fcm_token

Revision ID: c3d4e5f6b8a9
Revises: b2c3d4e5f6a7
Create Date: 2026-05-13 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = "c3d4e5f6b8a9"
down_revision = "b2c3d4e5f6a7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS fcm_token VARCHAR(512)
    """)


def downgrade() -> None:
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS fcm_token")
