from datetime import datetime
from pydantic import BaseModel, EmailStr


class UserResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    name: str
    email: EmailStr
    is_active: bool
    created_at: datetime
