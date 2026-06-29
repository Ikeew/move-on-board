from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.notification import Notification
from app.models.user import User
from app.repositories.notification_repository import NotificationRepository
from app.repositories.task_repository import TaskRepository
from app.schemas.notification import NotificationResponse

router = APIRouter(tags=["Notifications"])


@router.get("/notifications", response_model=list[NotificationResponse])
def list_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return unread notifications for the current user, including deadline alerts."""
    repo = NotificationRepository(db)
    _generate_deadline_notifications(db, repo, current_user)
    return repo.list_unread(current_user.id)


@router.post("/notifications/read-all", status_code=204)
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    NotificationRepository(db).mark_all_read(current_user.id)


def _generate_deadline_notifications(db: Session, repo: NotificationRepository, user: User) -> None:
    """Create deadline notifications for tasks assigned to the user that are due within 2 days."""
    task_repo = TaskRepository(db)
    now = datetime.now(timezone.utc)
    threshold = now + timedelta(days=2)

    tasks = task_repo.list_assigned_to_user(user.id)
    for row in tasks:
        task = row.task
        if not task.due_date:
            continue

        due = task.due_date
        if due.tzinfo is None:
            due = due.replace(tzinfo=timezone.utc)

        if due < now or due > threshold:
            continue

        already_exists = (
            db.query(Notification)
            .filter(
                Notification.user_id == user.id,
                Notification.type == "deadline",
                Notification.task_id == task.id,
                Notification.read == False,  # noqa: E712
            )
            .first()
        )
        if already_exists:
            continue

        days_left = (due - now).days
        if days_left == 0:
            when = "hoje"
        elif days_left == 1:
            when = "amanhã"
        else:
            when = f"em {days_left} dias"

        notif = Notification(
            user_id=user.id,
            type="deadline",
            title="Prazo se aproximando",
            body=f'A tarefa "{task.title}" vence {when}.',
            task_id=task.id,
        )
        repo.create(notif)
