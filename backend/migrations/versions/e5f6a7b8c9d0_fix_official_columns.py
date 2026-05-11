"""fix_official_columns

organizations.org_type kolonu ve OFFICIAL_MANAGER/OFFICIAL_STAFF rolleri eklendi.

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-05-11 10:30:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'e5f6a7b8c9d0'
down_revision: Union[str, None] = 'd4e5f6a7b8c9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. userrole enum'a resmi roller ekle
    op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'OFFICIAL_MANAGER'")
    op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'OFFICIAL_STAFF'")

    # 2. organizations tablosuna org_type kolonu ekle
    op.add_column(
        'organizations',
        sa.Column(
            'org_type',
            sa.Enum('STK', 'OFFICIAL', name='orgtype'),
            nullable=False,
            server_default='STK',
        ),
    )
    op.alter_column('organizations', 'org_type', server_default=None)

    # 3. Unique constraint'i org_type içerecek şekilde güncelle
    try:
        op.drop_constraint('uq_organization_name_city_district', 'organizations',
                           type_='unique')
    except Exception:
        pass  # zaten yoksa atla

    op.create_unique_constraint(
        'uq_organization_name_city_district_type',
        'organizations',
        ['name', 'city', 'district', 'org_type'],
    )


def downgrade() -> None:
    op.drop_constraint('uq_organization_name_city_district_type', 'organizations',
                       type_='unique')
    op.drop_column('organizations', 'org_type')
