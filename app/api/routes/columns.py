from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.column import ColumnCreate, ColumnUpdate, ColumnReorderRequest, ColumnResponse
from app.services.column_service import ColumnService

router = APIRouter(tags=["Columns"])


@router.get("/boards/{board_id}/columns", response_model=list[ColumnResponse])
def list_columns(
    board_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all columns of a board ordered by position."""
    return ColumnService(db).list_columns(board_id, current_user)


@router.post(
    "/boards/{board_id}/columns",
    response_model=ColumnResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_column(
    board_id: str,
    data: ColumnCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a new column to a board."""
    return ColumnService(db).create(board_id, data, current_user)


@router.put("/columns/{column_id}", response_model=ColumnResponse)
def update_column(
    column_id: str,
    data: ColumnUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Rename a column."""
    return ColumnService(db).update(column_id, data, current_user)


@router.delete("/columns/{column_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_column(
    column_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a column and all its tasks."""
    ColumnService(db).delete(column_id, current_user)


@router.patch(
    "/boards/{board_id}/columns/reorder",
    response_model=list[ColumnResponse],
)
def reorder_columns(
    board_id: str,
    data: ColumnReorderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Persist the new column order within a board."""
    return ColumnService(db).reorder(board_id, data, current_user)
