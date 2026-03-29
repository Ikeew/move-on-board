from sqlalchemy import String, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, generate_uuid


class Column(Base, TimestampMixin):
    __tablename__ = "columns"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    title: Mapped[str] = mapped_column(String(150), nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    board_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("boards.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # Relationships
    board: Mapped["Board"] = relationship("Board", back_populates="columns")  # noqa: F821
    tasks: Mapped[list["Task"]] = relationship(  # noqa: F821
        "Task",
        back_populates="column",
        cascade="all, delete-orphan",
        order_by="Task.position",
    )

    def __repr__(self) -> str:
        return f"<Column id={self.id} title={self.title} position={self.position}>"
