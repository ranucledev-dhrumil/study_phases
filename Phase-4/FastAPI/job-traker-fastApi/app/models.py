from datetime import date, datetime
from sqlalchemy import Date, DateTime, Enum, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db import Base
from app.schemas.applications import ApplicationStatus


class Application(Base):
    __tablename__ = "applications"
    __table_args__ = {"sqlite_autoincrement": True}

    # Mapped[...] is the type, and mapped_column(...) is the column config. 
    id: Mapped[int] = mapped_column(primary_key=True)

    owner_id: Mapped[int] = mapped_column( 
        ForeignKey("users.id", ondelete="CASCADE"), 
        index=True, 
        nullable=False, 
    )

    company: Mapped[str] = mapped_column(String(100))
    
    role: Mapped[str] = mapped_column(String(100))
    
    status: Mapped[ApplicationStatus] = mapped_column(
        Enum(ApplicationStatus, native_enum=False), default=ApplicationStatus.applied
    )
    
    # X | None means nullable.
    applied_on: Mapped[date | None] = mapped_column(Date)
    
    url: Mapped[str | None] = mapped_column(String(2048))
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # passive_deletes=True plus ondelete="CASCADE" lets the database delete the notes, so SQLAlchemy doesn't need to load them first. Loading them would be a lazy load, which fails in async.`
    notes: Mapped[list["Note"]] = relationship(
        back_populates="application",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

class Note(Base):
    __tablename__ = "notes"
    __table_args__ = {"sqlite_autoincrement": True}

    id: Mapped[int] = mapped_column(primary_key=True)
    application_id: Mapped[int] = mapped_column(
        ForeignKey("applications.id", ondelete="CASCADE"), index=True
    )
    body: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    application: Mapped["Application"] = relationship(back_populates="notes")

class User(Base):
    __tablename__ = "users"
    __table_args__ = {"sqlite_autoincrement": True}

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    email: Mapped[str] = mapped_column(
        String,
        unique=True,
        index=True,
        nullable=False,
    )

    hashed_password: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False,
    )

class AuditLog(Base):
    __tablename__ = "audit_logs"
    __table_args__ = {"sqlite_autoincrement": True}

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    action: Mapped[str] = mapped_column(String, nullable=False)

    application_id: Mapped[int | None] = mapped_column(
        ForeignKey("applications.id", ondelete="SET NULL"),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )