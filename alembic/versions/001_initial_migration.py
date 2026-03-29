"""Initial migration — create all tables

Revision ID: 001
Revises:
Create Date: 2025-01-01 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # --- users ---
    op.create_table(
        "users",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # --- boards ---
    op.create_table(
        "boards",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("title", sa.String(150), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("owner_id", sa.String(36), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["owner_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_boards_owner_id", "boards", ["owner_id"])

    # --- columns ---
    op.create_table(
        "columns",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("title", sa.String(150), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("board_id", sa.String(36), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["board_id"], ["boards.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_columns_board_id", "columns", ["board_id"])

    # --- priority enum ---
    # Use postgresql.ENUM with create_type=False so SQLAlchemy does NOT fire the
    # _on_table_create event that re-creates the type inside create_table().
    # We create it manually here once, before the tasks table.
    priority_enum = postgresql.ENUM("low", "medium", "high", name="priority_enum", create_type=False)
    priority_enum.create(op.get_bind(), checkfirst=True)

    # --- tasks ---
    op.create_table(
        "tasks",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "priority",
            postgresql.ENUM("low", "medium", "high", name="priority_enum", create_type=False),
            nullable=False,
            server_default="medium",
        ),
        sa.Column("due_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("position", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("column_id", sa.String(36), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["column_id"], ["columns.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_tasks_column_id", "tasks", ["column_id"])

    # --- labels ---
    op.create_table(
        "labels",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("name", sa.String(80), nullable=False),
        sa.Column("color", sa.String(7), nullable=False, server_default="#6366f1"),
        sa.Column("board_id", sa.String(36), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["board_id"], ["boards.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_labels_board_id", "labels", ["board_id"])

    # --- task_labels ---
    op.create_table(
        "task_labels",
        sa.Column("task_id", sa.String(36), nullable=False),
        sa.Column("label_id", sa.String(36), nullable=False),
        sa.PrimaryKeyConstraint("task_id", "label_id"),
        sa.UniqueConstraint("task_id", "label_id", name="uq_task_label"),
        sa.ForeignKeyConstraint(["task_id"], ["tasks.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["label_id"], ["labels.id"], ondelete="CASCADE"),
    )


def downgrade() -> None:
    op.drop_table("task_labels")
    op.drop_index("ix_labels_board_id", table_name="labels")
    op.drop_table("labels")
    op.drop_index("ix_tasks_column_id", table_name="tasks")
    op.drop_table("tasks")
    op.execute("DROP TYPE IF EXISTS priority_enum")
    op.drop_index("ix_columns_board_id", table_name="columns")
    op.drop_table("columns")
    op.drop_index("ix_boards_owner_id", table_name="boards")
    op.drop_table("boards")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
