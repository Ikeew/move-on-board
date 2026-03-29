from sqlalchemy.orm import Session
from sqlalchemy import select, func

from app.models.column import Column
from app.repositories.base import BaseRepository


class ColumnRepository(BaseRepository[Column]):
    def __init__(self, db: Session):
        super().__init__(Column, db)

    def list_by_board(self, board_id: str) -> list[Column]:
        stmt = (
            select(Column)
            .where(Column.board_id == board_id)
            .order_by(Column.position)
        )
        return list(self.db.scalars(stmt).all())

    def count_by_board(self, board_id: str) -> int:
        stmt = select(func.count()).where(Column.board_id == board_id)
        return self.db.scalar(stmt) or 0

    def list_by_ids(self, ids: list[str]) -> list[Column]:
        stmt = select(Column).where(Column.id.in_(ids))
        return list(self.db.scalars(stmt).all())
