"""Add board_members table and assignee_id to tasks

Revision ID: 002
Revises: 001
Create Date: 2025-01-02 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # --- board_members ---
    op.create_table(
        "board_members",
        sa.Column("board_id", sa.String(36), nullable=False),
        sa.Column("user_id", sa.String(36), nullable=False),
        sa.PrimaryKeyConstraint("board_id", "user_id"),
        sa.UniqueConstraint("board_id", "user_id", name="uq_board_member"),
        sa.ForeignKeyConstraint(["board_id"], ["boards.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_board_members_board_id", "board_members", ["board_id"])
    op.create_index("ix_board_members_user_id", "board_members", ["user_id"])

    # --- assignee_id em tasks ---
    op.add_column(
        "tasks",
        sa.Column("assignee_id", sa.String(36), nullable=True),
    )
    op.create_foreign_key(
        "fk_tasks_assignee_id",
        "tasks", "users",
        ["assignee_id"], ["id"],
        ondelete="SET NULL",
    )
    op.create_index("ix_tasks_assignee_id", "tasks", ["assignee_id"])


def downgrade() -> None:
    op.drop_index("ix_tasks_assignee_id", table_name="tasks")
    op.drop_constraint("fk_tasks_assignee_id", "tasks", type_="foreignkey")
    op.drop_column("tasks", "assignee_id")
    op.drop_index("ix_board_members_user_id", table_name="board_members")
    op.drop_index("ix_board_members_board_id", table_name="board_members")
    op.drop_table("board_members")
