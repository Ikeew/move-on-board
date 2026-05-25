from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.board_member import MemberAdd, MemberResponse
from app.services.board_member_service import BoardMemberService

router = APIRouter(tags=["Members"])


@router.get("/boards/{board_id}/members", response_model=list[MemberResponse])
def list_members(
    board_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return BoardMemberService(db).list_members(board_id, current_user)


@router.post(
    "/boards/{board_id}/members",
    response_model=MemberResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_member(
    board_id: str,
    data: MemberAdd,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return BoardMemberService(db).add_member(board_id, data, current_user)


@router.delete("/boards/{board_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_member(
    board_id: str,
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    BoardMemberService(db).remove_member(board_id, user_id, current_user)
