from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select, delete

from app.models.board import Board
from app.models.board_member import BoardMember
from app.models.user import User


class BoardMemberRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_members(self, board_id: str) -> list[User]:
        stmt = (
            select(User)
            .join(BoardMember, User.id == BoardMember.user_id)
            .where(BoardMember.board_id == board_id)
            .order_by(User.name)
        )
        return list(self.db.scalars(stmt).all())

    def is_member(self, board_id: str, user_id: str) -> bool:
        stmt = select(BoardMember).where(
            BoardMember.board_id == board_id,
            BoardMember.user_id == user_id,
        )
        return self.db.scalar(stmt) is not None

    def add(self, board_id: str, user_id: str) -> None:
        if not self.is_member(board_id, user_id):
            self.db.add(BoardMember(board_id=board_id, user_id=user_id))
            self.db.flush()

    def remove(self, board_id: str, user_id: str) -> None:
        stmt = delete(BoardMember).where(
            BoardMember.board_id == board_id,
            BoardMember.user_id == user_id,
        )
        self.db.execute(stmt)
        self.db.flush()
