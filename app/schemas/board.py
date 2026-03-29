from datetime import datetime
from pydantic import BaseModel


class BoardCreate(BaseModel):
    title: str
    description: str | None = None


class BoardUpdate(BaseModel):
    title: str | None = None
    description: str | None = None


class BoardResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    title: str
    description: str | None
    owner_id: str
    created_at: datetime
    updated_at: datetime
