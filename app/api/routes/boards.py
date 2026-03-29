from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.board import BoardCreate, BoardUpdate, BoardResponse
from app.services.board_service import BoardService

router = APIRouter(prefix="/boards", tags=["Boards"])


@router.post("", response_model=BoardResponse, status_code=status.HTTP_201_CREATED)
def create_board(
    data: BoardCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new board for the authenticated user."""
    return BoardService(db).create(data, current_user)


@router.get("", response_model=list[BoardResponse])
def list_boards(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all boards owned by the authenticated user."""
    return BoardService(db).list_boards(current_user)


@router.get("/{board_id}", response_model=BoardResponse)
def get_board(
    board_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific board by ID."""
    return BoardService(db).get_board(board_id, current_user)


@router.put("/{board_id}", response_model=BoardResponse)
def update_board(
    board_id: str,
    data: BoardUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a board's title or description."""
    return BoardService(db).update(board_id, data, current_user)


@router.delete("/{board_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_board(
    board_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a board and all its columns and tasks."""
    BoardService(db).delete(board_id, current_user)
