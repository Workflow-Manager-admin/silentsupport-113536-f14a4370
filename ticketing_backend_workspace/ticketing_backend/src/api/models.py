"""
SQLAlchemy models for Ticketing System.

Defines Ticket and TicketResponse for persistent storage in SQLite.
"""
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class Ticket(Base):
    """
    SQLAlchemy model for a support ticket.
    """
    __tablename__ = "tickets"

    ticket_id = Column(String, primary_key=True, index=True)
    title = Column(String(100), nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    closed = Column(Boolean, default=False)
    closed_at = Column(DateTime, nullable=True)
    close_reason = Column(Text, nullable=True)

    responses = relationship(
        "TicketResponse",
        back_populates="ticket",
        cascade="all, delete-orphan"
    )


class TicketResponse(Base):
    """
    SQLAlchemy model for a response to a ticket.
    """
    __tablename__ = "ticket_responses"

    id = Column(String, primary_key=True, index=True)
    ticket_id = Column(
        String, ForeignKey("tickets.ticket_id"), nullable=False, index=True
    )
    responder = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    ticket = relationship("Ticket", back_populates="responses")
