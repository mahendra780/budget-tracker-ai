from datetime import date

from pydantic import BaseModel


class RecurringTransactionCreate(BaseModel):
    title: str
    amount: float
    type: str
    category: str
    frequency: str
    next_due_date: date
    is_active: bool = True


class RecurringTransactionUpdate(RecurringTransactionCreate):
    pass


class RecurringTransactionResponse(BaseModel):
    id: int
    title: str
    amount: float
    type: str
    category: str
    frequency: str
    next_due_date: date
    is_active: bool

    class Config:
        from_attributes = True
