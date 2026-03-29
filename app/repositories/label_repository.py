from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.label import Label
from app.repositories.base import BaseRepository


class LabelRepository(BaseRepository[Label]):
    def __init__(self, db: Session):
        super().__init__(Label, db)

    def list_by_board(self, board_id: str) -> list[Label]:
        stmt = select(Label).where(Label.board_id == board_id).order_by(Label.name)
        return list(self.db.scalars(stmt).all())

    def get_by_ids(self, ids: list[str]) -> list[Label]:
        stmt = select(Label).where(Label.id.in_(ids))
        return list(self.db.scalars(stmt).all())
