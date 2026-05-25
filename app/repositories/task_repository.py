from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select, func

from app.models.task import Task, Priority
from app.models.column import Column
from app.models.board import Board
from app.models.task_label import TaskLabel
from app.repositories.base import BaseRepository

# Named tuple for tasks with context
from typing import NamedTuple

class TaskWithContext(NamedTuple):
    task: Task
    board_id: str
    board_title: str
    column_title: str


class TaskRepository(BaseRepository[Task]):
    def __init__(self, db: Session):
        super().__init__(Task, db)

    def get_with_labels(self, task_id: str) -> Task | None:
        stmt = (
            select(Task)
            .where(Task.id == task_id)
            .options(selectinload(Task.labels))
        )
        return self.db.scalar(stmt)

    def get_with_labels_and_assignee(self, task_id: str) -> Task | None:
        stmt = (
            select(Task)
            .where(Task.id == task_id)
            .options(selectinload(Task.labels), selectinload(Task.assignee))
        )
        return self.db.scalar(stmt)

    def list_by_column(self, column_id: str) -> list[Task]:
        stmt = (
            select(Task)
            .where(Task.column_id == column_id)
            .options(selectinload(Task.labels), selectinload(Task.assignee))
            .order_by(Task.position)
        )
        return list(self.db.scalars(stmt).all())

    def list_by_board(self, board_id: str) -> list[Task]:
        stmt = (
            select(Task)
            .join(Column, Task.column_id == Column.id)
            .where(Column.board_id == board_id)
            .options(selectinload(Task.labels), selectinload(Task.assignee))
            .order_by(Column.position, Task.position)
        )
        return list(self.db.scalars(stmt).all())

    def count_by_column(self, column_id: str) -> int:
        stmt = select(func.count()).where(Task.column_id == column_id)
        return self.db.scalar(stmt) or 0

    def list_by_column_ordered(self, column_id: str) -> list[Task]:
        stmt = (
            select(Task)
            .where(Task.column_id == column_id)
            .order_by(Task.position)
        )
        return list(self.db.scalars(stmt).all())

    def search_by_board(
        self,
        board_id: str,
        title: str | None = None,
        priority: Priority | None = None,
        label_id: str | None = None,
    ) -> list[Task]:
        stmt = (
            select(Task)
            .join(Column, Task.column_id == Column.id)
            .where(Column.board_id == board_id)
            .options(selectinload(Task.labels))
        )

        if title:
            stmt = stmt.where(Task.title.ilike(f"%{title}%"))

        if priority:
            stmt = stmt.where(Task.priority == priority)

        if label_id:
            stmt = stmt.join(TaskLabel, Task.id == TaskLabel.task_id).where(
                TaskLabel.label_id == label_id
            )

        return list(self.db.scalars(stmt).all())

    def list_assigned_to_user(self, user_id: str) -> list["TaskWithContext"]:
        stmt = (
            select(Task, Column.title.label("column_title"), Board.id.label("board_id"), Board.title.label("board_title"))
            .join(Column, Task.column_id == Column.id)
            .join(Board, Column.board_id == Board.id)
            .where(Task.assignee_id == user_id)
            .options(selectinload(Task.labels), selectinload(Task.assignee))
            .order_by(Task.due_date.asc().nulls_last(), Task.created_at.desc())
        )
        rows = self.db.execute(stmt).all()
        return [
            TaskWithContext(
                task=row[0],
                board_id=row.board_id,
                board_title=row.board_title,
                column_title=row.column_title,
            )
            for row in rows
        ]

    def add_label(self, task: Task, label_id: str) -> None:
        existing = self.db.get(TaskLabel, {"task_id": task.id, "label_id": label_id})
        if not existing:
            tl = TaskLabel(task_id=task.id, label_id=label_id)
            self.db.add(tl)
            self.db.flush()

    def remove_all_labels(self, task: Task) -> None:
        from sqlalchemy import delete
        stmt = delete(TaskLabel).where(TaskLabel.task_id == task.id)
        self.db.execute(stmt)
        self.db.flush()
