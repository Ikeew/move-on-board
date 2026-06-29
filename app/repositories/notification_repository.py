from sqlalchemy.orm import Session

from app.models.notification import Notification


class NotificationRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_unread(self, user_id: str) -> list[Notification]:
        return (
            self.db.query(Notification)
            .filter(Notification.user_id == user_id, Notification.read == False)  # noqa: E712
            .order_by(Notification.created_at.desc())
            .all()
        )

    def create(self, notif: Notification) -> Notification:
        self.db.add(notif)
        self.db.commit()
        self.db.refresh(notif)
        return notif

    def mark_all_read(self, user_id: str) -> None:
        self.db.query(Notification).filter(
            Notification.user_id == user_id, Notification.read == False  # noqa: E712
        ).update({"read": True})
        self.db.commit()
