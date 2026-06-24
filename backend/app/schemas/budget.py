from pydantic import BaseModel


class BudgetCreate(BaseModel):
    category: str
    monthly_limit: float


class BudgetResponse(BaseModel):
    id: int
    category: str
    monthly_limit: float
    month: int
    year: int

    class Config:
        from_attributes = True
