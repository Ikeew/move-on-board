from datetime import datetime
from pydantic import BaseModel, EmailStr


class UserResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    name: str
    email: EmailStr
    bio: str | None = None
    is_active: bool
    created_at: datetime


class UpdateProfileRequest(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    bio: str | None = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
