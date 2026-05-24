from pydantic import BaseModel
from datetime import date


class TransactionCreate(BaseModel):
    title: str
    amount: float
    type: str
    category: str
    date: date


class TransactionResponse(BaseModel):
    id: int
    title: str
    amount: float
    type: str
    category: str
    date: date

    class Config:
        from_attributes = True