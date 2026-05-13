"""add_help_requests_and_assignments

help_requests ve assignments tabloları oluşturuldu.
needtype, requeststatus, assignmentstatus enum'ları eklendi.

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2026-05-11 12:00:00.000000
"""
from typing import Sequence, Union

from alembic import op

revision: str = 'f6a7b8c9d0e1'
down_revision: Union[str, None] = 'e5f6a7b8c9d0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── 1. Enum türleri (zaten varsa atla) ────────────────────
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE needtype AS ENUM ('RESCUE','MEDICAL','SHELTER','FOOD','OTHER');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE requeststatus AS ENUM
                ('PENDING','SCORED','ASSIGNED','EN_ROUTE','COMPLETED','CANCELLED');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE assignmentstatus AS ENUM
                ('ASSIGNED','EN_ROUTE','COMPLETED','CANCELLED');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$
    """)

    # ── 2. help_requests tablosu ──────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS help_requests (
            id              UUID PRIMARY KEY,
            user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
            latitude        DOUBLE PRECISION NOT NULL,
            longitude       DOUBLE PRECISION NOT NULL,
            location        geometry(POINT,4326) NOT NULL,
            need_type       needtype NOT NULL,
            urgency_level   INTEGER NOT NULL,
            person_count    INTEGER NOT NULL DEFAULT 1,
            description     TEXT,
            status          requeststatus NOT NULL DEFAULT 'PENDING',
            priority_score  DOUBLE PRECISION,
            area_damage_score DOUBLE PRECISION,
            created_at      TIMESTAMPTZ DEFAULT now(),
            updated_at      TIMESTAMPTZ DEFAULT now()
        )
    """)

    # ── 3. assignments tablosu ────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS assignments (
            id                    UUID PRIMARY KEY,
            request_id            UUID NOT NULL UNIQUE
                                      REFERENCES help_requests(id) ON DELETE CASCADE,
            volunteer_id          UUID REFERENCES users(id) ON DELETE SET NULL,
            route_distance_km     DOUBLE PRECISION NOT NULL,
            route_duration_minutes DOUBLE PRECISION NOT NULL,
            safety_score          DOUBLE PRECISION NOT NULL,
            composite_score       DOUBLE PRECISION NOT NULL,
            route_geometry        JSONB,
            status                assignmentstatus NOT NULL DEFAULT 'ASSIGNED',
            assigned_at           TIMESTAMPTZ DEFAULT now(),
            updated_at            TIMESTAMPTZ DEFAULT now()
        )
    """)

    # ── 4. İndeksler ──────────────────────────────────────────
    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_help_requests_status
            ON help_requests(status)
    """)
    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_help_requests_priority_score
            ON help_requests(priority_score)
    """)
    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_help_requests_need_type
            ON help_requests(need_type)
    """)
    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_help_requests_user_id
            ON help_requests(user_id)
    """)
    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_assignments_volunteer_id
            ON assignments(volunteer_id)
    """)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS assignments")
    op.execute("DROP TABLE IF EXISTS help_requests")
    op.execute("DROP TYPE IF EXISTS assignmentstatus")
    op.execute("DROP TYPE IF EXISTS requeststatus")
    op.execute("DROP TYPE IF EXISTS needtype")
