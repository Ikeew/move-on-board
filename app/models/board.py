from sqlalchemy import String, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, generate_uuid


class Board(Base, TimestampMixin):
    __tablename__ = "boards"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    title: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    owner_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # Relationships
    owner: Mapped["User"] = relationship("User", back_populates="boards")  # noqa: F821
    columns: Mapped[list["Column"]] = relationship(  # noqa: F821
        "Column",
        back_populates="board",
        cascade="all, delete-orphan",
        order_by="Column.position",
    )
    labels: Mapped[list["Label"]] = relationship(  # noqa: F821
        "Label", back_populates="board", cascade="all, delete-orphan"
    )
    members: Mapped[list["User"]] = relationship(  # noqa: F821
        "User",
        secondary="board_members",
        back_populates="member_boards",
    )

    def __repr__(self) -> str:
        return f"<Board id={self.id} title={self.title}>"
