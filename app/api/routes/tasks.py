from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.task import Priority
from app.models.user import User
from app.schemas.task import TaskCreate, TaskUpdate, TaskMoveRequest, TaskResponse, TaskWithContextResponse
from app.services.task_service import TaskService

router = APIRouter(tags=["Tasks"])


@router.get("/tasks/mine", response_model=list[TaskWithContextResponse])
def list_my_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all tasks assigned to the authenticated user, across all boards."""
    return TaskService(db).list_assigned_to_me(current_user)


@router.post(
    "/columns/{column_id}/tasks",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_task(
    column_id: str,
    data: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a task inside a column."""
    return TaskService(db).create(column_id, data, current_user)


@router.get("/boards/{board_id}/tasks", response_model=list[TaskResponse])
def list_tasks_by_board(
    board_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all tasks across all columns of a board."""
    return TaskService(db).list_by_board(board_id, current_user)


@router.get("/tasks/{task_id}", response_model=TaskResponse)
def get_task(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single task by ID."""
    return TaskService(db).get_task(task_id, current_user)


@router.put("/tasks/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: str,
    data: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update task fields (title, description, priority, due_date, labels)."""
    return TaskService(db).update(task_id, data, current_user)


@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a task."""
    TaskService(db).delete(task_id, current_user)


@router.patch("/tasks/{task_id}/move", response_model=TaskResponse)
def move_task(
    task_id: str,
    data: TaskMoveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Move a task to a different column or reorder within the same column."""
    return TaskService(db).move(task_id, data, current_user)


@router.get("/boards/{board_id}/tasks/search", response_model=list[TaskResponse])
def search_tasks(
    board_id: str,
    title: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Search tasks by title within a board."""
    return TaskService(db).search(board_id, current_user, title=title)


@router.get("/boards/{board_id}/tasks/filter", response_model=list[TaskResponse])
def filter_tasks(
    board_id: str,
    priority: Priority | None = Query(default=None),
    label_id: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Filter tasks by priority and/or label."""
    return TaskService(db).search(board_id, current_user, priority=priority, label_id=label_id)
