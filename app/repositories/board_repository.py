from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select

from app.models.board import Board
from app.repositories.base import BaseRepository


class BoardRepository(BaseRepository[Board]):
    def __init__(self, db: Session):
        super().__init__(Board, db)

    def list_by_owner(self, owner_id: str) -> list[Board]:
        stmt = (
            select(Board)
            .where(Board.owner_id == owner_id)
            .order_by(Board.created_at.desc())
        )
        return list(self.db.scalars(stmt).all())

    def get_with_columns(self, board_id: str) -> Board | None:
        stmt = (
            select(Board)
            .where(Board.id == board_id)
            .options(selectinload(Board.columns))
        )
        return self.db.scalar(stmt)
