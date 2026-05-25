"""Add bio column to users

Revision ID: 003
Revises: 002
Create Date: 2025-01-03 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("bio", sa.String(300), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "bio")
