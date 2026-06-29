from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select, or_

from app.models.board import Board
from app.models.board_member import BoardMember
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

    def list_accessible(self, user_id: str) -> list[Board]:
        """Boards owned by or shared with the user."""
        member_board_ids = select(BoardMember.board_id).where(BoardMember.user_id == user_id)
        stmt = (
            select(Board)
            .where(or_(Board.owner_id == user_id, Board.id.in_(member_board_ids)))
            .order_by(Board.created_at.desc())
        )
        return list(self.db.scalars(stmt).all())

    def user_can_access(self, board: Board, user_id: str) -> bool:
        """True if user is owner or member of the board."""
        if board.owner_id == user_id:
            return True
        stmt = select(BoardMember).where(
            BoardMember.board_id == board.id,
            BoardMember.user_id == user_id,
        )
        return self.db.scalar(stmt) is not None

    def get_with_columns(self, board_id: str) -> Board | None:
        stmt = (
            select(Board)
            .where(Board.id == board_id)
            .options(selectinload(Board.columns))
        )
        return self.db.scalar(stmt)
