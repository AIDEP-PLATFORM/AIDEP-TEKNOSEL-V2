"""add_tc_no_and_skills_completed

Revision ID: 4a14f79c9dc1
Revises: dbc87135a5e9
Create Date: 2026-05-10 19:27:15.440779

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4a14f79c9dc1'
down_revision: Union[str, None] = 'dbc87135a5e9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # users.tc_no: yeni zorunlu olmayan kolon
    op.add_column('users', sa.Column('tc_no', sa.String(length=11), nullable=True))

    # ngo_profiles.authorization_number: NOT NULL → nullable (yetki numarası opsiyonel)
    op.alter_column(
        'ngo_profiles', 'authorization_number',
        existing_type=sa.VARCHAR(length=100),
        nullable=True,
    )

    # volunteer_profiles.skills_completed: mevcut satırlar False alır
    op.add_column(
        'volunteer_profiles',
        sa.Column(
            'skills_completed',
            sa.Boolean(),
            nullable=False,
            server_default=sa.text('false'),
        ),
    )
    # server_default'u kaldır — sadece migration sırasında mevcut satırlar için lazımdı
    op.alter_column('volunteer_profiles', 'skills_completed', server_default=None)


def downgrade() -> None:
    op.drop_column('volunteer_profiles', 'skills_completed')
    op.drop_column('users', 'tc_no')
    op.alter_column(
        'ngo_profiles', 'authorization_number',
        existing_type=sa.VARCHAR(length=100),
        nullable=False,
    )
