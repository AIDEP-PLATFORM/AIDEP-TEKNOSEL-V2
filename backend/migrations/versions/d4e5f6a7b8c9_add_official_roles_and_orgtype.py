"""add_official_roles_and_orgtype

Değişiklikler:
- userrole enum'a OFFICIAL_MANAGER ve OFFICIAL_STAFF eklendi
- orgtype enum yaratıldı (STK, OFFICIAL)
- organizations tablosuna org_type kolonu eklendi
- official_profiles tablosu yaratıldı

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-05-11 10:00:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


def _enum_exists(name: str) -> bool:
    conn = op.get_bind()
    result = conn.execute(
        sa.text("SELECT 1 FROM pg_type WHERE typname = :name"), {"name": name}
    )
    return result.scalar() is not None


revision: str = 'd4e5f6a7b8c9'
down_revision: Union[str, None] = 'c3d4e5f6a7b8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. userrole enum'a yeni değerler ekle (PG bunu destekler)
    op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'OFFICIAL_MANAGER'")
    op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'OFFICIAL_STAFF'")

    # 2. orgtype enum yarat (zaten varsa atla)
    op.execute("CREATE TYPE orgtype AS ENUM('STK', 'OFFICIAL')") \
        if not _enum_exists('orgtype') else None

    # 3. organizations tablosuna org_type kolonu ekle (varsayılan STK)
    op.add_column(
        'organizations',
        sa.Column(
            'org_type',
            sa.Enum('STK', 'OFFICIAL', name='orgtype'),
            nullable=False,
            server_default='STK',
        ),
    )
    # server_default kaldır — sadece mevcut satırlar için gerekliydi
    op.alter_column('organizations', 'org_type', server_default=None)

    # Benzersizlik kısıtlamasını güncelle: org_type'ı da dahil et
    # (Aynı isim/il/ilçe farklı tipte olabilir: AKUT STK vs AKUT OFFICIAL)
    op.drop_constraint('uq_organization_name_city_district', 'organizations',
                       type_='unique')
    op.create_unique_constraint(
        'uq_organization_name_city_district_type',
        'organizations',
        ['name', 'city', 'district', 'org_type'],
    )

    # 4. official_profiles tablosu
    op.create_table(
        'official_profiles',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('organization_id', sa.UUID(), nullable=False),
        sa.Column('registration_number', sa.String(length=10), nullable=False),
        sa.Column('address', sa.String(length=500), nullable=True),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'],
                                ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id'),
        sa.UniqueConstraint('registration_number'),
    )


def downgrade() -> None:
    op.drop_table('official_profiles')

    op.drop_constraint('uq_organization_name_city_district_type', 'organizations',
                       type_='unique')
    op.create_unique_constraint(
        'uq_organization_name_city_district',
        'organizations',
        ['name', 'city', 'district'],
    )

    op.drop_column('organizations', 'org_type')
    op.execute("DROP TYPE orgtype")
    # Not: userrole enum'dan değer kaldırılamaz (PG kısıtı)
