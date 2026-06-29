from datetime import datetime
from pydantic import BaseModel


class NotificationResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    user_id: str
    type: str
    title: str
    body: str
    read: bool
    task_id: str | None
    created_at: datetime
