from pydantic import BaseModel


class BudgetTemplateCreate(BaseModel):
    category: str
    monthly_limit: float
    auto_renew: bool = True


class BudgetTemplateResponse(BaseModel):
    id: int
    category: str
    monthly_limit: float
    auto_renew: bool

    class Config:
        from_attributes = True
