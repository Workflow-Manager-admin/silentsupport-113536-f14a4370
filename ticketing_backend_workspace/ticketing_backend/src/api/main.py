"""
FastAPI app for SilentSupport Ticketing Backend - persistent storage with SQLite and SQLAlchemy.

Implements all endpoints using ORM models, ensuring all ticket and response data persists.
"""
from fastapi import FastAPI, HTTPException, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime
from uuid import uuid4

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from .models import Base, Ticket as TicketDB, TicketResponse as TicketResponseDB

DATABASE_URL = "sqlite:///./tickets.sqlite3"
engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(bind=engine)

# Ensure tables exist at startup
Base.metadata.create_all(bind=engine)

# --- Pydantic Schemas ---


# PUBLIC_INTERFACE
class TicketResponse(BaseModel):
    """Model representing a response to a ticket."""
    responder: str = Field(
        ..., description="Who responded (could be 'Support', or system generated)."
    )
    message: str = Field(..., description="Response message content.")
    timestamp: datetime = Field(
        default_factory=datetime.utcnow, description="Time of response."
    )

    class Config:
        orm_mode = True


# PUBLIC_INTERFACE
class TicketCreate(BaseModel):
    """Schema for creating a new ticket."""
    title: str = Field(
        ...,
        min_length=4,
        max_length=100,
        description="Short description or title of the ticket."
    )
    message: str = Field(
        ...,
        min_length=4,
        max_length=2000,
        description="Detailed message of the ticket."
    )


# PUBLIC_INTERFACE
class TicketUpdate(BaseModel):
    """Schema for updating an existing ticket."""
    title: Optional[str] = Field(None, min_length=4, max_length=100)
    message: Optional[str] = Field(None, min_length=4, max_length=2000)


# PUBLIC_INTERFACE
class TicketClose(BaseModel):
    """Schema for closing a ticket (optional reason)."""
    close_reason: Optional[str] = Field(
        None, description="Reason for closing the ticket, if any."
    )


# PUBLIC_INTERFACE
class Ticket(BaseModel):
    """Model representing a support ticket."""
    ticket_id: str = Field(..., description="Unique ticket identifier.")
    title: str
    message: str
    created_at: datetime
    closed: bool = False
    closed_at: Optional[datetime] = None
    close_reason: Optional[str] = None
    responses: List[TicketResponse] = Field(default_factory=list)

    class Config:
        orm_mode = True


# Dependency for DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


app = FastAPI(
    title="SilentSupport Ticketing API",
    description=(
        "Backend for anonymous ticketing system; "
        "submit, update, get, respond, close tickets anonymously."
    ),
    version="0.2.0",
    openapi_tags=[{"name": "tickets", "description": "Ticket operations"}]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["root"], summary="Health check")
def health_check():
    """Check health/status of backend."""
    return {"message": "Healthy"}


# PUBLIC_INTERFACE
@app.post(
    "/tickets",
    response_model=Ticket,
    status_code=status.HTTP_201_CREATED,
    tags=["tickets"],
    summary="Submit a new anonymous ticket"
)
def submit_ticket(ticket_create: TicketCreate, db: Session = Depends(get_db)):
    """
    Submit a new anonymous support ticket.

    - **title**: Short description of the ticket
    - **message**: Detailed content of the ticket

    Returns the created ticket object.
    """
    ticket_id = str(uuid4())
    now = datetime.utcnow()
    ticket = TicketDB(
        ticket_id=ticket_id,
        title=ticket_create.title,
        message=ticket_create.message,
        created_at=now
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return Ticket(
        ticket_id=ticket.ticket_id,
        title=ticket.title,
        message=ticket.message,
        created_at=ticket.created_at,
        closed=ticket.closed,
        closed_at=ticket.closed_at,
        close_reason=ticket.close_reason,
        responses=[]
    )


# PUBLIC_INTERFACE
@app.get(
    "/tickets",
    response_model=List[Ticket],
    tags=["tickets"],
    summary="Get all tickets"
)
def get_tickets(db: Session = Depends(get_db)):
    """
    Retrieve all tickets (anonymous, for dashboard/listing).

    Returns a list of ticket objects.
    """
    tickets = db.query(TicketDB).all()
    result = []
    for t in tickets:
        responses = [
            TicketResponse(
                responder=r.responder,
                message=r.message,
                timestamp=r.timestamp
            )
            for r in t.responses
        ]
        result.append(
            Ticket(
                ticket_id=t.ticket_id,
                title=t.title,
                message=t.message,
                created_at=t.created_at,
                closed=t.closed,
                closed_at=t.closed_at,
                close_reason=t.close_reason,
                responses=responses
            )
        )
    return result


# PUBLIC_INTERFACE
@app.get(
    "/tickets/{ticket_id}",
    response_model=Ticket,
    tags=["tickets"],
    summary="Get a single ticket by ID"
)
def get_ticket(ticket_id: str, db: Session = Depends(get_db)):
    """
    Retrieve a ticket by its unique ID.

    - **ticket_id**: Ticket identifier

    Returns the ticket object.
    """
    ticket = db.query(TicketDB).filter(TicketDB.ticket_id == ticket_id).first()
    if ticket is None:
        raise HTTPException(status_code=404, detail="Ticket not found")
    responses = [
        TicketResponse(
            responder=r.responder,
            message=r.message,
            timestamp=r.timestamp
        )
        for r in ticket.responses
    ]
    return Ticket(
        ticket_id=ticket.ticket_id,
        title=ticket.title,
        message=ticket.message,
        created_at=ticket.created_at,
        closed=ticket.closed,
        closed_at=ticket.closed_at,
        close_reason=ticket.close_reason,
        responses=responses
    )


# PUBLIC_INTERFACE
@app.patch(
    "/tickets/{ticket_id}",
    response_model=Ticket,
    tags=["tickets"],
    summary="Update a ticket"
)
def update_ticket(ticket_id: str, ticket_update: TicketUpdate, db: Session = Depends(get_db)):
    """
    Update the title or message of an open ticket.

    - **ticket_id**: Ticket identifier
    - **title/message**: New values

    Returns the updated ticket object.
    """
    ticket = db.query(TicketDB).filter(TicketDB.ticket_id == ticket_id).first()
    if ticket is None:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if ticket.closed:
        raise HTTPException(status_code=400, detail="Cannot update a closed ticket")
    update_data = ticket_update.dict(exclude_unset=True)
    for k, v in update_data.items():
        setattr(ticket, k, v)
    db.commit()
    db.refresh(ticket)
    responses = [
        TicketResponse(
            responder=r.responder,
            message=r.message,
            timestamp=r.timestamp
        )
        for r in ticket.responses
    ]
    return Ticket(
        ticket_id=ticket.ticket_id,
        title=ticket.title,
        message=ticket.message,
        created_at=ticket.created_at,
        closed=ticket.closed,
        closed_at=ticket.closed_at,
        close_reason=ticket.close_reason,
        responses=responses
    )


# PUBLIC_INTERFACE
@app.post(
    "/tickets/{ticket_id}/responses",
    response_model=Ticket,
    tags=["tickets"],
    summary="Add a response to a ticket"
)
def add_response(ticket_id: str, response: TicketResponse, db: Session = Depends(get_db)):
    """
    Add a response/message to a ticket, by support or system.

    - **ticket_id**: Ticket identifier
    - **response**: TicketResponse object

    Returns the updated ticket object.
    """
    ticket = db.query(TicketDB).filter(TicketDB.ticket_id == ticket_id).first()
    if ticket is None:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if ticket.closed:
        raise HTTPException(status_code=400, detail="Cannot respond to a closed ticket")
    resp_id = str(uuid4())
    new_response = TicketResponseDB(
        id=resp_id,
        ticket_id=ticket_id,
        responder=response.responder,
        message=response.message,
        timestamp=response.timestamp,
    )
    db.add(new_response)
    db.commit()
    db.refresh(ticket)
    responses = [
        TicketResponse(
            responder=r.responder,
            message=r.message,
            timestamp=r.timestamp
        )
        for r in ticket.responses
    ]
    return Ticket(
        ticket_id=ticket.ticket_id,
        title=ticket.title,
        message=ticket.message,
        created_at=ticket.created_at,
        closed=ticket.closed,
        closed_at=ticket.closed_at,
        close_reason=ticket.close_reason,
        responses=responses
    )


# PUBLIC_INTERFACE
@app.post(
    "/tickets/{ticket_id}/close",
    response_model=Ticket,
    tags=["tickets"],
    summary="Close a ticket"
)
def close_ticket(ticket_id: str, close: TicketClose, db: Session = Depends(get_db)):
    """
    Close an existing ticket, with optional close reason.

    - **ticket_id**: Ticket identifier
    - **close_reason**: Optional reason for closure

    Returns the updated (closed) ticket object.
    """
    ticket = db.query(TicketDB).filter(TicketDB.ticket_id == ticket_id).first()
    if ticket is None:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if ticket.closed:
        raise HTTPException(status_code=400, detail="Ticket is already closed")
    ticket.closed = True
    ticket.closed_at = datetime.utcnow()
    ticket.close_reason = close.close_reason
    db.commit()
    responses = [
        TicketResponse(
            responder=r.responder,
            message=r.message,
            timestamp=r.timestamp
        )
        for r in ticket.responses
    ]
    return Ticket(
        ticket_id=ticket.ticket_id,
        title=ticket.title,
        message=ticket.message,
        created_at=ticket.created_at,
        closed=ticket.closed,
        closed_at=ticket.closed_at,
        close_reason=ticket.close_reason,
        responses=responses
    )
