from datetime import datetime
from pydantic import BaseModel


class ColumnCreate(BaseModel):
    title: str
    position: int | None = None


class ColumnUpdate(BaseModel):
    title: str | None = None


class ColumnReorderItem(BaseModel):
    id: str
    position: int


class ColumnReorderRequest(BaseModel):
    columns: list[ColumnReorderItem]


class ColumnResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    title: str
    position: int
    board_id: str
    created_at: datetime
    updated_at: datetime
