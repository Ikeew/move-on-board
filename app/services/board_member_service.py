from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User
from app.repositories.board_repository import BoardRepository
from app.repositories.board_member_repository import BoardMemberRepository
from app.repositories.user_repository import UserRepository
from app.schemas.board_member import MemberAdd, MemberResponse


class BoardMemberService:
    def __init__(self, db: Session):
        self.board_repo = BoardRepository(db)
        self.member_repo = BoardMemberRepository(db)
        self.user_repo = UserRepository(db)

    def list_members(self, board_id: str, requester: User) -> list[MemberResponse]:
        self._require_owner(board_id, requester)
        users = self.member_repo.list_members(board_id)
        return [MemberResponse.model_validate(u) for u in users]

    def add_member(self, board_id: str, data: MemberAdd, requester: User) -> MemberResponse:
        board = self._require_owner(board_id, requester)

        target = self.user_repo.get_by_email(data.email)
        if not target:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado.")

        if target.id == board.owner_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="O dono do quadro já tem acesso.")

        if self.member_repo.is_member(board_id, target.id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Usuário já é membro do quadro.")

        self.member_repo.add(board_id, target.id)
        return MemberResponse.model_validate(target)

    def remove_member(self, board_id: str, user_id: str, requester: User) -> None:
        board = self._require_owner(board_id, requester)

        if user_id == board.owner_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Não é possível remover o dono do quadro.")

        if not self.member_repo.is_member(board_id, user_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Membro não encontrado.")

        self.member_repo.remove(board_id, user_id)

    def _require_owner(self, board_id: str, user: User):
        board = self.board_repo.get_by_id(board_id)
        if not board or board.owner_id != user.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quadro não encontrado.")
        return board
