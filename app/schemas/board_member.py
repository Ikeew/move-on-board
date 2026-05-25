from pydantic import BaseModel, EmailStr


class MemberAdd(BaseModel):
    email: EmailStr


class MemberResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    name: str
    email: str
