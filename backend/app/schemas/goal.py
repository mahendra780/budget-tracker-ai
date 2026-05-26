from pydantic import BaseModel
from datetime import date


class GoalCreate(BaseModel):
    goal_name: str
    target_amount: float
    current_amount: float = 0
    target_date: date


class GoalUpdate(BaseModel):
    goal_name: str
    target_amount: float
    target_date: date


class GoalResponse(BaseModel):
    id: int
    goal_name: str
    target_amount: float
    current_amount: float
    target_date: date

    class Config:
        from_attributes = True
