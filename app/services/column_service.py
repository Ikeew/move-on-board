from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.board import Board
from app.models.column import Column
from app.models.user import User
from app.repositories.board_repository import BoardRepository
from app.repositories.column_repository import ColumnRepository
from app.schemas.column import ColumnCreate, ColumnUpdate, ColumnReorderRequest, ColumnResponse


class ColumnService:
    def __init__(self, db: Session):
        self.board_repo = BoardRepository(db)
        self.col_repo = ColumnRepository(db)

    def list_columns(self, board_id: str, owner: User) -> list[ColumnResponse]:
        self._get_accessible_board(board_id, owner)
        columns = self.col_repo.list_by_board(board_id)
        return [ColumnResponse.model_validate(c) for c in columns]

    def create(self, board_id: str, data: ColumnCreate, owner: User) -> ColumnResponse:
        board = self._get_owned_board(board_id, owner)
        position = data.position
        if position is None:
            position = self.col_repo.count_by_board(board_id)

        column = Column(
            title=data.title,
            position=position,
            board_id=board.id,
        )
        self.col_repo.save(column)
        return ColumnResponse.model_validate(column)

    def update(self, column_id: str, data: ColumnUpdate, owner: User) -> ColumnResponse:
        column = self._get_owned_column(column_id, owner)
        if data.title is not None:
            column.title = data.title
        self.col_repo.save(column)
        return ColumnResponse.model_validate(column)

    def delete(self, column_id: str, owner: User) -> None:
        column = self._get_owned_column(column_id, owner)
        self.col_repo.delete(column)

    def reorder(self, board_id: str, data: ColumnReorderRequest, owner: User) -> list[ColumnResponse]:
        self._get_owned_board(board_id, owner)
        columns = self.col_repo.list_by_ids([item.id for item in data.columns])

        # Verify all columns belong to this board
        col_map = {c.id: c for c in columns}
        for item in data.columns:
            col = col_map.get(item.id)
            if not col or col.board_id != board_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Column {item.id} does not belong to this board.",
                )
            col.position = item.position
            self.col_repo.save(col)

        updated = self.col_repo.list_by_board(board_id)
        return [ColumnResponse.model_validate(c) for c in updated]

    def _get_accessible_board(self, board_id: str, user: User) -> Board:
        board = self.board_repo.get_by_id(board_id)
        if not board or not self.board_repo.user_can_access(board, user.id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Board not found.")
        return board

    def _get_owned_board(self, board_id: str, owner: User) -> Board:
        board = self.board_repo.get_by_id(board_id)
        if not board or board.owner_id != owner.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Board not found.")
        return board

    def _get_owned_column(self, column_id: str, owner: User) -> Column:
        column = self.col_repo.get_by_id(column_id)
        if not column:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Column not found.")
        board = self.board_repo.get_by_id(column.board_id)
        if not board or board.owner_id != owner.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Column not found.")
        return column
