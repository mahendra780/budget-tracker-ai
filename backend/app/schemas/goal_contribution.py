from datetime import date

from pydantic import BaseModel


class GoalContributionCreate(BaseModel):
    action: str
    amount: float


class GoalContributionResponse(BaseModel):
    id: int
    goal_id: int
    amount: float
    action: str
    created_at: date

    class Config:
        from_attributes = True
