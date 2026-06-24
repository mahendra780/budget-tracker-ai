from datetime import date

from pydantic import BaseModel, field_validator


VALID_TRANSACTION_TYPES = {"income", "expense"}
VALID_FREQUENCIES = {"daily", "weekly", "monthly", "yearly"}


class RecurringTransactionCreate(BaseModel):
    title: str
    amount: float
    type: str
    category: str
    frequency: str
    start_date: date
    end_date: date | None = None
    active: bool = True

    @field_validator("type")
    @classmethod
    def validate_type(cls, value: str):
        normalized = value.lower()
        if normalized not in VALID_TRANSACTION_TYPES:
            raise ValueError("type must be income or expense")
        return normalized

    @field_validator("frequency")
    @classmethod
    def validate_frequency(cls, value: str):
        normalized = value.lower()
        if normalized not in VALID_FREQUENCIES:
            raise ValueError("frequency must be daily, weekly, monthly, or yearly")
        return normalized


class RecurringTransactionUpdate(RecurringTransactionCreate):
    last_processed_date: date | None = None
    pass


class RecurringTransactionResponse(BaseModel):
    id: int
    title: str
    amount: float
    type: str
    category: str
    frequency: str
    start_date: date
    end_date: date | None
    last_processed_date: date | None
    active: bool

    class Config:
        from_attributes = True


class UpcomingRecurringTransactionResponse(RecurringTransactionResponse):
    next_due_date: date | None
