"""add_damage_photos

damage_photos tablosu oluşturuldu.
Her yardım talebine birden fazla YOLOv8 analiz edilmiş hasar fotoğrafı eklenebilir.

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-05-13 10:00:00.000000
"""
from typing import Sequence, Union

from alembic import op

revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS damage_photos (
            id                UUID PRIMARY KEY,
            request_id        UUID NOT NULL
                                  REFERENCES help_requests(id) ON DELETE CASCADE,
            uploaded_by       UUID REFERENCES users(id) ON DELETE SET NULL,
            minio_key         VARCHAR(512) NOT NULL,
            original_filename VARCHAR(255),
            damage_score      DOUBLE PRECISION,
            damage_labels     JSONB,
            latitude          DOUBLE PRECISION,
            longitude         DOUBLE PRECISION,
            created_at        TIMESTAMPTZ DEFAULT now()
        )
    """)

    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_damage_photos_request_id
            ON damage_photos(request_id)
    """)

    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_damage_photos_uploaded_by
            ON damage_photos(uploaded_by)
    """)


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_damage_photos_uploaded_by")
    op.execute("DROP INDEX IF EXISTS ix_damage_photos_request_id")
    op.execute("DROP TABLE IF EXISTS damage_photos")
