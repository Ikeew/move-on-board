from datetime import datetime
from pydantic import BaseModel, field_validator
import re


class LabelCreate(BaseModel):
    name: str
    color: str = "#6366f1"

    @field_validator("color")
    @classmethod
    def validate_hex_color(cls, v: str) -> str:
        if not re.match(r"^#[0-9A-Fa-f]{6}$", v):
            raise ValueError("color must be a valid hex color (e.g. #ff5733)")
        return v


class LabelUpdate(BaseModel):
    name: str | None = None
    color: str | None = None

    @field_validator("color")
    @classmethod
    def validate_hex_color(cls, v: str | None) -> str | None:
        if v is not None and not re.match(r"^#[0-9A-Fa-f]{6}$", v):
            raise ValueError("color must be a valid hex color (e.g. #ff5733)")
        return v


class LabelResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    name: str
    color: str
    board_id: str
    created_at: datetime
