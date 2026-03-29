import enum

from sqlalchemy import String, ForeignKey, Integer, Text, DateTime, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, generate_uuid


class Priority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class Task(Base, TimestampMixin):
    __tablename__ = "tasks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    priority: Mapped[Priority] = mapped_column(
        SAEnum(Priority, name="priority_enum", create_type=False, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=Priority.MEDIUM,
    )
    due_date: Mapped[str | None] = mapped_column(DateTime(timezone=True), nullable=True)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    column_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("columns.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # Relationships
    column: Mapped["Column"] = relationship("Column", back_populates="tasks")  # noqa: F821
    labels: Mapped[list["Label"]] = relationship(  # noqa: F821
        "Label",
        secondary="task_labels",
        back_populates="tasks",
    )

    def __repr__(self) -> str:
        return f"<Task id={self.id} title={self.title} position={self.position}>"
