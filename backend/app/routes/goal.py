from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date

from app.database.dependencies import get_db

from app.models.goal import Goal
from app.models.goal_contribution import GoalContribution
from app.models.transaction import Transaction

from app.schemas.goal import (
    GoalCreate,
    GoalResponse,
    GoalUpdate
)
from app.schemas.goal_contribution import (
    GoalContributionCreate,
    GoalContributionResponse
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
    updated_goal: GoalUpdate,
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
    goal.target_date = updated_goal.target_date

    db.commit()
    db.refresh(goal)

    return goal


@router.post(
    "/{goal_id}/contributions",
    response_model=GoalContributionResponse
)
def create_goal_contribution(
    goal_id: int,
    contribution: GoalContributionCreate,
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

    action = contribution.action.lower()

    if action not in ["add", "withdraw"]:
        raise HTTPException(
            status_code=400,
            detail="Contribution action must be add or withdraw"
        )

    if contribution.amount <= 0:
        raise HTTPException(
            status_code=400,
            detail="Invalid contribution amount"
        )

    if action == "withdraw" and contribution.amount > goal.current_amount:
        raise HTTPException(
            status_code=400,
            detail="Insufficient savings"
        )

    today = date.today()

    transaction = Transaction(
        title=(
            f"Goal Contribution - {goal.goal_name}"
            if action == "add"
            else f"Goal Withdrawal - {goal.goal_name}"
        ),
        amount=contribution.amount,
        type="expense" if action == "add" else "income",
        category="Savings",
        date=today
    )

    db.add(transaction)
    db.flush()

    if action == "add":
        goal.current_amount += contribution.amount
    else:
        goal.current_amount -= contribution.amount

    new_contribution = GoalContribution(
        goal_id=goal.id,
        amount=contribution.amount,
        action=action,
        date=today,
        created_at=today,
        transaction_id=transaction.id
    )

    db.add(new_contribution)
    db.commit()
    db.refresh(new_contribution)

    return new_contribution


@router.get(
    "/{goal_id}/contributions",
    response_model=list[GoalContributionResponse]
)
def get_goal_contributions(
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

    return (
        db.query(GoalContribution)
        .filter(GoalContribution.goal_id == goal_id)
        .order_by(
            GoalContribution.created_at.desc(),
            GoalContribution.id.desc()
        )
        .all()
    )


@router.get("/contributions/history/all")
def get_all_goal_contributions(
    db: Session = Depends(get_db)
):
    contributions = (
        db.query(GoalContribution, Goal.goal_name)
        .join(Goal, Goal.id == GoalContribution.goal_id)
        .order_by(
            GoalContribution.created_at.desc(),
            GoalContribution.id.desc()
        )
        .all()
    )

    return [
        {
            "id": contribution.id,
            "goal_id": contribution.goal_id,
            "goal_name": goal_name,
            "amount": contribution.amount,
            "action": contribution.action,
            "created_at": contribution.created_at
        }
        for contribution, goal_name in contributions
    ]


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

    (
        db.query(GoalContribution)
        .filter(GoalContribution.goal_id == goal_id)
        .delete()
    )

    db.delete(goal)
    db.commit()

    return {
        "message": "Goal deleted successfully"
    }
