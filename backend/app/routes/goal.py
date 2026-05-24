from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.dependencies import get_db

from app.models.goal import Goal

from app.schemas.goal import (
    GoalCreate,
    GoalResponse
)

router = APIRouter(
    prefix="/goals",
    tags=["Goals"]
)


# Create Goal
@router.post("/", response_model=GoalResponse)
def create_goal(
    goal: GoalCreate,
    db: Session = Depends(get_db)
):
    new_goal = Goal(
        goal_name=goal.goal_name,
        target_amount=goal.target_amount,
        current_amount=goal.current_amount,
        target_date=goal.target_date
    )

    db.add(new_goal)
    db.commit()
    db.refresh(new_goal)

    return new_goal


# Get All Goals
@router.get("/",
            response_model=list[GoalResponse])
def get_goals(
    db: Session = Depends(get_db)
):
    return db.query(Goal).all()

@router.get("/progress")
def goal_progress(
    db: Session = Depends(get_db)
):
    goals = db.query(Goal).all()

    result = []

    for goal in goals:

        remaining_amount = (
            goal.target_amount
            - goal.current_amount
        )

        progress_percentage = (
            (goal.current_amount / goal.target_amount)
            * 100
            if goal.target_amount > 0
            else 0
        )

        result.append({
            "id": goal.id,
            "goal_name": goal.goal_name,
            "target_amount": goal.target_amount,
            "current_amount": goal.current_amount,
            "remaining_amount": remaining_amount,
            "progress_percentage": round(
                progress_percentage,
                2
            ),
            "target_date":goal.target_date
        })

    return result
# Get Single Goal
@router.get("/{goal_id}",
            response_model=GoalResponse)
def get_goal(
    goal_id: int,
    db: Session = Depends(get_db)
):
    goal = (
        db.query(Goal)
        .filter(Goal.id == goal_id)
        .first()
    )

    if not goal:
        raise HTTPException(
            status_code=404,
            detail="Goal not found"
        )

    return goal


# Update Goal
@router.put("/{goal_id}",
            response_model=GoalResponse)
def update_goal(
    goal_id: int,
    updated_goal: GoalCreate,
    db: Session = Depends(get_db)
):
    goal = (
        db.query(Goal)
        .filter(Goal.id == goal_id)
        .first()
    )

    if not goal:
        raise HTTPException(
            status_code=404,
            detail="Goal not found"
        )

    goal.goal_name = updated_goal.goal_name
    goal.target_amount = updated_goal.target_amount
    goal.current_amount = updated_goal.current_amount
    goal.target_date = updated_goal.target_date

    db.commit()
    db.refresh(goal)

    return goal


# Delete Goal
@router.delete("/{goal_id}")
def delete_goal(
    goal_id: int,
    db: Session = Depends(get_db)
):
    goal = (
        db.query(Goal)
        .filter(Goal.id == goal_id)
        .first()
    )

    if not goal:
        raise HTTPException(
            status_code=404,
            detail="Goal not found"
        )

    db.delete(goal)
    db.commit()

    return {
        "message": "Goal deleted successfully"
    }