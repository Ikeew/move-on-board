from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.label import LabelCreate, LabelUpdate, LabelResponse
from app.services.label_service import LabelService

router = APIRouter(tags=["Labels"])


@router.post(
    "/boards/{board_id}/labels",
    response_model=LabelResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_label(
    board_id: str,
    data: LabelCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a label within a board."""
    return LabelService(db).create(board_id, data, current_user)


@router.get("/boards/{board_id}/labels", response_model=list[LabelResponse])
def list_labels(
    board_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all labels for a board."""
    return LabelService(db).list_labels(board_id, current_user)


@router.put("/labels/{label_id}", response_model=LabelResponse)
def update_label(
    label_id: str,
    data: LabelUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a label's name or color."""
    return LabelService(db).update(label_id, data, current_user)


@router.delete("/labels/{label_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_label(
    label_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a label (also removes it from all tasks)."""
    LabelService(db).delete(label_id, current_user)
