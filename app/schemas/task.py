from datetime import datetime
from pydantic import BaseModel

from app.models.task import Priority
from app.schemas.label import LabelResponse


class TaskCreate(BaseModel):
    title: str
    description: str | None = None
    priority: Priority = Priority.MEDIUM
    due_date: datetime | None = None
    position: int | None = None
    label_ids: list[str] = []


class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    priority: Priority | None = None
    due_date: datetime | None = None
    label_ids: list[str] | None = None


class TaskMoveRequest(BaseModel):
    column_id: str
    position: int


class TaskResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    title: str
    description: str | None
    priority: Priority
    due_date: datetime | None
    position: int
    column_id: str
    labels: list[LabelResponse] = []
    created_at: datetime
    updated_at: datetime
