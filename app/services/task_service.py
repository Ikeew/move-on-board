from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.column import Column
from app.models.task import Task, Priority
from app.models.user import User
from app.repositories.board_repository import BoardRepository
from app.repositories.column_repository import ColumnRepository
from app.repositories.task_repository import TaskRepository
from app.repositories.label_repository import LabelRepository
from app.schemas.task import TaskCreate, TaskUpdate, TaskMoveRequest, TaskResponse, TaskWithContextResponse


class TaskService:
    def __init__(self, db: Session):
        self.board_repo = BoardRepository(db)
        self.col_repo = ColumnRepository(db)
        self.task_repo = TaskRepository(db)
        self.label_repo = LabelRepository(db)

    def create(self, column_id: str, data: TaskCreate, owner: User) -> TaskResponse:
        column = self._get_owned_column(column_id, owner)
        position = data.position
        if position is None:
            position = self.task_repo.count_by_column(column_id)

        task = Task(
            title=data.title,
            description=data.description,
            priority=data.priority,
            due_date=data.due_date,
            position=position,
            column_id=column.id,
            assignee_id=data.assignee_id,
        )
        self.task_repo.save(task)

        if data.label_ids:
            self._sync_labels(task, data.label_ids, column.board_id)

        task = self.task_repo.get_with_labels_and_assignee(task.id)
        return TaskResponse.model_validate(task)

    def get_task(self, task_id: str, owner: User) -> TaskResponse:
        task = self._get_owned_task(task_id, owner)
        return TaskResponse.model_validate(task)

    def list_by_board(self, board_id: str, owner: User) -> list[TaskResponse]:
        self._get_owned_board(board_id, owner)
        tasks = self.task_repo.list_by_board(board_id)
        return [TaskResponse.model_validate(t) for t in tasks]

    def update(self, task_id: str, data: TaskUpdate, owner: User) -> TaskResponse:
        task = self._get_owned_task(task_id, owner)
        column = self.col_repo.get_by_id(task.column_id)

        if data.title is not None:
            task.title = data.title
        if data.description is not None:
            task.description = data.description
        if data.priority is not None:
            task.priority = data.priority
        if data.due_date is not None:
            task.due_date = data.due_date
        if data.label_ids is not None:
            self._sync_labels(task, data.label_ids, column.board_id)
        # assignee_id pode ser None explicitamente para remover
        if "assignee_id" in data.model_fields_set:
            task.assignee_id = data.assignee_id

        self.task_repo.save(task)
        task = self.task_repo.get_with_labels_and_assignee(task.id)
        return TaskResponse.model_validate(task)

    def delete(self, task_id: str, owner: User) -> None:
        task = self._get_owned_task(task_id, owner)
        self.task_repo.delete(task)

    def move(self, task_id: str, data: TaskMoveRequest, owner: User) -> TaskResponse:
        task = self._get_owned_task(task_id, owner)

        # Validate target column belongs to the same owner
        target_column = self._get_owned_column(data.column_id, owner)

        source_column_id = task.column_id
        old_position = task.position
        new_position = data.position

        if source_column_id == target_column.id:
            # Reordering within same column
            self._reorder_within_column(task, new_position)
        else:
            # Moving to a different column
            self._remove_from_column(task, source_column_id, old_position)
            self._insert_into_column(task, target_column.id, new_position)

        task = self.task_repo.get_with_labels_and_assignee(task.id)
        return TaskResponse.model_validate(task)

    def list_assigned_to_me(self, user: User) -> list[TaskWithContextResponse]:
        rows = self.task_repo.list_assigned_to_user(user.id)
        result = []
        for row in rows:
            base = TaskResponse.model_validate(row.task)
            result.append(TaskWithContextResponse(
                **base.model_dump(),
                board_id=row.board_id,
                board_title=row.board_title,
                column_title=row.column_title,
            ))
        return result

    def search(
        self,
        board_id: str,
        owner: User,
        title: str | None = None,
        priority: Priority | None = None,
        label_id: str | None = None,
    ) -> list[TaskResponse]:
        self._get_owned_board(board_id, owner)
        tasks = self.task_repo.search_by_board(board_id, title=title, priority=priority, label_id=label_id)
        return [TaskResponse.model_validate(t) for t in tasks]

    # -------------------------------------------------------------------------
    # Internal helpers
    # -------------------------------------------------------------------------

    def _reorder_within_column(self, task: Task, new_position: int) -> None:
        siblings = self.task_repo.list_by_column_ordered(task.column_id)
        siblings = [t for t in siblings if t.id != task.id]

        # Clamp position
        new_position = max(0, min(new_position, len(siblings)))
        siblings.insert(new_position, task)

        for idx, t in enumerate(siblings):
            t.position = idx
            self.task_repo.save(t)

    def _remove_from_column(self, task: Task, column_id: str, old_position: int) -> None:
        siblings = self.task_repo.list_by_column_ordered(column_id)
        siblings = [t for t in siblings if t.id != task.id]
        for idx, t in enumerate(siblings):
            t.position = idx
            self.task_repo.save(t)

    def _insert_into_column(self, task: Task, column_id: str, new_position: int) -> None:
        siblings = self.task_repo.list_by_column_ordered(column_id)
        new_position = max(0, min(new_position, len(siblings)))
        siblings.insert(new_position, task)
        task.column_id = column_id
        for idx, t in enumerate(siblings):
            t.position = idx
            self.task_repo.save(t)

    def _sync_labels(self, task: Task, label_ids: list[str], board_id: str) -> None:
        labels = self.label_repo.get_by_ids(label_ids)
        # Ensure all labels belong to the same board
        for label in labels:
            if label.board_id != board_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Label {label.id} does not belong to this board.",
                )
        self.task_repo.remove_all_labels(task)
        for label in labels:
            self.task_repo.add_label(task, label.id)

    def _get_owned_board(self, board_id: str, owner: User):
        board = self.board_repo.get_by_id(board_id)
        if not board or board.owner_id != owner.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Board not found.")
        return board

    def _get_owned_column(self, column_id: str, owner: User) -> Column:
        column = self.col_repo.get_by_id(column_id)
        if not column:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Column not found.")
        board = self.board_repo.get_by_id(column.board_id)
        if not board or board.owner_id != owner.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Column not found.")
        return column

    def _get_owned_task(self, task_id: str, owner: User) -> Task:
        task = self.task_repo.get_with_labels_and_assignee(task_id)
        if not task:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")
        column = self.col_repo.get_by_id(task.column_id)
        board = self.board_repo.get_by_id(column.board_id)
        if not board or board.owner_id != owner.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")
        return task
