"""restructure_ngo_and_roles

Değişiklikler:
- userrole enum yeniden yaratıldı: NGO_MANAGER, NGO_STAFF, ADMIN eklendi; NGO kaldırıldı
- ngo_profiles tablosu kaldırıldı
- organizations tablosu eklendi (admin yönetimli STK şubeleri)
- ngo_manager_profiles tablosu eklendi
- ngo_staff_profiles tablosu eklendi
- volunteer_profiles yeniden yaratıldı: preferred_ngo_id → organization_id (organizations'a FK)

Revision ID: c3d4e5f6a7b8
Revises: 4a14f79c9dc1
Create Date: 2026-05-10 20:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import geoalchemy2


revision: str = 'c3d4e5f6a7b8'
down_revision: Union[str, None] = '4a14f79c9dc1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Eski FK'lı tabloları düşür
    op.drop_table('volunteer_profiles')
    op.drop_table('ngo_profiles')

    # 2. userrole enum'u yeniden yarat (NGO kaldırıldı, yeni roller eklendi)
    # Eski NGO rolündeki kullanıcıları temizle (geliştirme ortamı — üretimde migrate edilmeli)
    op.execute("DELETE FROM users WHERE role::text = 'NGO'")
    op.execute("ALTER TABLE users ALTER COLUMN role TYPE VARCHAR(50)")
    op.execute("DROP TYPE userrole")
    op.execute("""
        CREATE TYPE userrole AS ENUM(
            'CITIZEN', 'VOLUNTEER', 'NGO_MANAGER', 'NGO_STAFF', 'ADMIN'
        )
    """)
    op.execute(
        "ALTER TABLE users ALTER COLUMN role TYPE userrole USING role::userrole"
    )

    # 3. organizations tablosu
    op.create_table(
        'organizations',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('city', sa.String(length=100), nullable=False),
        sa.Column('district', sa.String(length=100), nullable=False),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name', 'city', 'district',
                            name='uq_organization_name_city_district'),
    )

    # 4. ngo_manager_profiles tablosu
    op.create_table(
        'ngo_manager_profiles',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('organization_id', sa.UUID(), nullable=False),
        sa.Column('activity_areas', sa.ARRAY(sa.String()), nullable=False),
        sa.Column('address', sa.String(length=500), nullable=True),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(
            ['organization_id'], ['organizations.id'], ondelete='CASCADE'
        ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id'),
    )

    # 5. ngo_staff_profiles tablosu
    op.create_table(
        'ngo_staff_profiles',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('organization_id', sa.UUID(), nullable=False),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(
            ['organization_id'], ['organizations.id'], ondelete='CASCADE'
        ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id'),
    )

    # 6. volunteer_profiles yeniden yarat (organization_id → organizations)
    op.create_table(
        'volunteer_profiles',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('organization_id', sa.UUID(), nullable=True),
        sa.Column('skills', sa.ARRAY(sa.String()), nullable=False),
        sa.Column(
            'skills_completed',
            sa.Boolean(),
            nullable=False,
            server_default=sa.text('false'),
        ),
        sa.Column(
            'is_available',
            sa.Boolean(),
            nullable=False,
            server_default=sa.text('true'),
        ),
        sa.Column(
            'active_task_count',
            sa.Integer(),
            nullable=False,
            server_default=sa.text('0'),
        ),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(
            ['organization_id'], ['organizations.id'],
            ondelete='SET NULL',
            name='fk_volunteer_organization',
        ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id'),
    )


def downgrade() -> None:
    op.drop_table('volunteer_profiles')
    op.drop_table('ngo_staff_profiles')
    op.drop_table('ngo_manager_profiles')
    op.drop_table('organizations')

    # userrole enum'u eski haline döndür
    op.execute("ALTER TABLE users ALTER COLUMN role TYPE VARCHAR(50)")
    op.execute("DROP TYPE userrole")
    op.execute("""
        CREATE TYPE userrole AS ENUM('CITIZEN', 'VOLUNTEER', 'NGO')
    """)
    op.execute(
        "ALTER TABLE users ALTER COLUMN role TYPE userrole USING role::userrole"
    )

    # ngo_profiles yeniden yarat
    op.create_table(
        'ngo_profiles',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('organization_name', sa.String(length=255), nullable=False),
        sa.Column('authorization_number', sa.String(length=100), nullable=True),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('authorization_number'),
        sa.UniqueConstraint('user_id'),
    )

    # volunteer_profiles eski haline döndür
    op.create_table(
        'volunteer_profiles',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('preferred_ngo_id', sa.UUID(), nullable=True),
        sa.Column('skills', sa.ARRAY(sa.String()), nullable=False),
        sa.Column(
            'skills_completed', sa.Boolean(), nullable=False,
            server_default=sa.text('false'),
        ),
        sa.Column(
            'is_available', sa.Boolean(), nullable=False,
            server_default=sa.text('true'),
        ),
        sa.Column(
            'active_task_count', sa.Integer(), nullable=False,
            server_default=sa.text('0'),
        ),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(
            ['preferred_ngo_id'], ['ngo_profiles.id'],
            ondelete='SET NULL',
            name='fk_volunteer_preferred_ngo',
            use_alter=True,
        ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id'),
    )
