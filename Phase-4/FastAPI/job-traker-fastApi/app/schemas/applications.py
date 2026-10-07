from pydantic import BaseModel, Field, field_validator, HttpUrl
from enum import Enum
from datetime import date, datetime
from app.schemas.notes import NoteRead

class ApplicationStatus(str, Enum):
    applied = "applied"
    interview = "interview"
    offer = "offer"
    rejected = "rejected"

class ApplicationCreate(BaseModel):

    @field_validator("company", "role", mode="before")
    @classmethod
    def strip_whitespace(cls, value:str):
        if isinstance(value, str):
            return value.strip()

        return value

    @field_validator("applied_on")
    @classmethod
    def no_future(cls, value):
        if value is not None and value > date.today():
            raise ValueError("applied_on cannot be in the future")

        return value

    company: str = Field(min_length=1, max_length=100)
    role: str = Field(min_length=1, max_length=100)
    status: ApplicationStatus = ApplicationStatus.applied
    applied_on:  date | None=None
    url: HttpUrl | None = None

class ApplicationUpdate(BaseModel):

    @field_validator("company", "role", "status", mode="before")
    @classmethod
    def reject_null(cls, value):
        if value is None:
            raise ValueError("cannot be null; omit the field to leave it unchanged")
        return value

    @field_validator("company", "role", mode="before")
    @classmethod
    def strip_whitespace(cls, value:str):
        if isinstance(value, str):
            return value.strip()

        return value
    
    @field_validator("applied_on")
    @classmethod
    def no_future(cls, value):
        if value is not None and value > date.today():
            raise ValueError("applied_on cannot be in the future")

        return value
    
    company: str | None = Field(None, min_length=1, max_length=100)
    role: str | None = Field(None, min_length=1, max_length=100)
    status: ApplicationStatus | None = None
    applied_on:  date | None = None
    url: HttpUrl | None = None

class ApplicationRead(BaseModel):
    id: int
    company: str
    role: str
    status: ApplicationStatus
    applied_on: date | None
    url: HttpUrl | None
    created_at: datetime

class ApplicationStats(BaseModel):
    total: int
    applied: int
    interview: int
    offer: int
    rejected: int

class ApplicationDetail(ApplicationRead):
    notes: list[NoteRead]