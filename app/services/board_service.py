from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.board import Board
from app.models.user import User
from app.repositories.board_repository import BoardRepository
from app.schemas.board import BoardCreate, BoardUpdate, BoardResponse


class BoardService:
    def __init__(self, db: Session):
        self.repo = BoardRepository(db)

    def create(self, data: BoardCreate, owner: User) -> BoardResponse:
        board = Board(
            title=data.title,
            description=data.description,
            owner_id=owner.id,
        )
        self.repo.save(board)
        return BoardResponse.model_validate(board)

    def list_boards(self, owner: User) -> list[BoardResponse]:
        boards = self.repo.list_by_owner(owner.id)
        return [BoardResponse.model_validate(b) for b in boards]

    def get_board(self, board_id: str, owner: User) -> BoardResponse:
        board = self._get_owned(board_id, owner)
        return BoardResponse.model_validate(board)

    def update(self, board_id: str, data: BoardUpdate, owner: User) -> BoardResponse:
        board = self._get_owned(board_id, owner)
        if data.title is not None:
            board.title = data.title
        if data.description is not None:
            board.description = data.description
        self.repo.save(board)
        return BoardResponse.model_validate(board)

    def delete(self, board_id: str, owner: User) -> None:
        board = self._get_owned(board_id, owner)
        self.repo.delete(board)

    def _get_owned(self, board_id: str, owner: User) -> Board:
        board = self.repo.get_by_id(board_id)
        if not board or board.owner_id != owner.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Board not found.")
        return board
