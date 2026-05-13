"""add_teams_and_refactor_assignments

teams ve team_members tabloları oluşturuldu.
assignments tablosunda volunteer_id → team_id olarak değiştirildi.

Revision ID: a1b2c3d4e5f6
Revises: f6a7b8c9d0e1
Create Date: 2026-05-11 14:00:00.000000
"""
from typing import Sequence, Union

from alembic import op

revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'f6a7b8c9d0e1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── 1. teams tablosu ──────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS teams (
            id                UUID PRIMARY KEY,
            organization_id   UUID NOT NULL
                                  REFERENCES organizations(id) ON DELETE CASCADE,
            name              VARCHAR(255) NOT NULL,
            description       TEXT,
            active_task_count INTEGER NOT NULL DEFAULT 0,
            created_at        TIMESTAMPTZ DEFAULT now()
        )
    """)
    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_teams_organization_id
            ON teams(organization_id)
    """)

    # ── 2. team_members tablosu ───────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS team_members (
            id         UUID PRIMARY KEY,
            team_id    UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
            user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ DEFAULT now(),
            CONSTRAINT uq_team_member UNIQUE (team_id, user_id)
        )
    """)
    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_team_members_team_id
            ON team_members(team_id)
    """)
    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_team_members_user_id
            ON team_members(user_id)
    """)

    # ── 3. assignments: volunteer_id kaldır, team_id ekle ─────
    # volunteer_id kolonu varsa sil
    op.execute("""
        DO $$ BEGIN
            ALTER TABLE assignments DROP COLUMN IF EXISTS volunteer_id;
        EXCEPTION WHEN others THEN NULL;
        END $$
    """)

    # team_id kolonu yoksa ekle
    op.execute("""
        DO $$ BEGIN
            ALTER TABLE assignments
                ADD COLUMN team_id UUID REFERENCES teams(id) ON DELETE SET NULL;
        EXCEPTION WHEN duplicate_column THEN NULL;
        END $$
    """)

    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_assignments_team_id
            ON assignments(team_id)
    """)


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_assignments_team_id")
    op.execute("ALTER TABLE assignments DROP COLUMN IF EXISTS team_id")
    op.execute("""
        DO $$ BEGIN
            ALTER TABLE assignments
                ADD COLUMN volunteer_id UUID REFERENCES users(id) ON DELETE SET NULL;
        EXCEPTION WHEN duplicate_column THEN NULL;
        END $$
    """)
    op.execute("DROP INDEX IF EXISTS ix_team_members_user_id")
    op.execute("DROP INDEX IF EXISTS ix_team_members_team_id")
    op.execute("DROP TABLE IF EXISTS team_members")
    op.execute("DROP INDEX IF EXISTS ix_teams_organization_id")
    op.execute("DROP TABLE IF EXISTS teams")
