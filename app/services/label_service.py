from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.board import Board
from app.models.label import Label
from app.models.user import User
from app.repositories.board_repository import BoardRepository
from app.repositories.label_repository import LabelRepository
from app.schemas.label import LabelCreate, LabelUpdate, LabelResponse


class LabelService:
    def __init__(self, db: Session):
        self.board_repo = BoardRepository(db)
        self.label_repo = LabelRepository(db)

    def create(self, board_id: str, data: LabelCreate, owner: User) -> LabelResponse:
        board = self._get_owned_board(board_id, owner)
        label = Label(
            name=data.name,
            color=data.color,
            board_id=board.id,
        )
        self.label_repo.save(label)
        return LabelResponse.model_validate(label)

    def list_labels(self, board_id: str, owner: User) -> list[LabelResponse]:
        board = self.board_repo.get_by_id(board_id)
        if not board or not self.board_repo.user_can_access(board, owner.id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Board not found.")
        labels = self.label_repo.list_by_board(board_id)
        return [LabelResponse.model_validate(l) for l in labels]

    def update(self, label_id: str, data: LabelUpdate, owner: User) -> LabelResponse:
        label = self._get_owned_label(label_id, owner)
        if data.name is not None:
            label.name = data.name
        if data.color is not None:
            label.color = data.color
        self.label_repo.save(label)
        return LabelResponse.model_validate(label)

    def delete(self, label_id: str, owner: User) -> None:
        label = self._get_owned_label(label_id, owner)
        self.label_repo.delete(label)

    def _get_owned_board(self, board_id: str, owner: User) -> Board:
        board = self.board_repo.get_by_id(board_id)
        if not board or board.owner_id != owner.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Board not found.")
        return board

    def _get_owned_label(self, label_id: str, owner: User) -> Label:
        label = self.label_repo.get_by_id(label_id)
        if not label:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Label not found.")
        board = self.board_repo.get_by_id(label.board_id)
        if not board or board.owner_id != owner.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Label not found.")
        return label
