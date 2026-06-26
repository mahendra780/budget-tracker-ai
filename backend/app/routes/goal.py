from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database.auth_dependencies import get_current_user
from app.database.dependencies import get_db
from app.models.goal import Goal
from app.models.goal_contribution import GoalContribution
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.goal import (
    GoalCreate,
    GoalResponse,
    GoalUpdate,
)
from app.schemas.goal_contribution import (
    GoalContributionCreate,
    GoalContributionResponse,
)

router = APIRouter(
    prefix="/goals",
    tags=["Goals"],
)


def get_goal_or_404(
    db: Session,
    goal_id: int,
    user_id: int,
):
    goal = (
        db.query(Goal)
        .filter(
            Goal.id == goal_id,
            Goal.user_id == user_id,
        )
        .first()
    )

    if not goal:
        raise HTTPException(
            status_code=404,
            detail="Goal not found",
        )

    return goal


def goal_transaction_ids(db: Session, user_id: int):
    return (
        db.query(GoalContribution.transaction_id)
        .filter(
            GoalContribution.transaction_id.isnot(None),
            GoalContribution.user_id == user_id,
        )
    )


@router.post("/", response_model=GoalResponse)
def create_goal(
    goal: GoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    new_goal = Goal(
        user_id=current_user.id,
        goal_name=goal.goal_name,
        target_amount=goal.target_amount,
        current_amount=goal.current_amount,
        target_date=goal.target_date,
    )

    db.add(new_goal)
    db.commit()
    db.refresh(new_goal)

    return new_goal


@router.get("/", response_model=list[GoalResponse])
def get_goals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Goal)
        .filter(Goal.user_id == current_user.id)
        .all()
    )


@router.get("/progress")
def goal_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goals = (
        db.query(Goal)
        .filter(Goal.user_id == current_user.id)
        .all()
    )

    result = []

    for goal in goals:
        remaining_amount = goal.target_amount - goal.current_amount

        progress_percentage = (
            (goal.current_amount / goal.target_amount) * 100
            if goal.target_amount > 0
            else 0
        )

        result.append({
            "id": goal.id,
            "goal_name": goal.goal_name,
            "target_amount": goal.target_amount,
            "current_amount": goal.current_amount,
            "remaining_amount": remaining_amount,
            "progress_percentage": round(progress_percentage, 2),
            "target_date": goal.target_date,
        })

    return result


@router.get("/{goal_id}", response_model=GoalResponse)
def get_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_goal_or_404(db, goal_id, current_user.id)


@router.put("/{goal_id}", response_model=GoalResponse)
def update_goal(
    goal_id: int,
    updated_goal: GoalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = get_goal_or_404(db, goal_id, current_user.id)

    goal.goal_name = updated_goal.goal_name
    goal.target_amount = updated_goal.target_amount
    goal.target_date = updated_goal.target_date

    db.commit()
    db.refresh(goal)

    return goal


@router.post(
    "/{goal_id}/contributions",
    response_model=GoalContributionResponse,
)
def create_goal_contribution(
    goal_id: int,
    contribution: GoalContributionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = get_goal_or_404(db, goal_id, current_user.id)

    action = contribution.action.lower()

    if action not in ["add", "withdraw"]:
        raise HTTPException(
            status_code=400,
            detail="Contribution action must be add or withdraw",
        )

    if contribution.amount <= 0:
        raise HTTPException(
            status_code=400,
            detail="Invalid contribution amount",
        )

    if action == "add":
        linked_goal_transaction_ids = goal_transaction_ids(
            db,
            current_user.id,
        )

        total_income = (
            db.query(func.sum(Transaction.amount))
            .filter(
                Transaction.type == "income",
                Transaction.user_id == current_user.id,
                ~Transaction.id.in_(linked_goal_transaction_ids),
            )
            .scalar()
        ) or 0

        total_expense = (
            db.query(func.sum(Transaction.amount))
            .filter(
                Transaction.type == "expense",
                Transaction.user_id == current_user.id,
                ~Transaction.id.in_(linked_goal_transaction_ids),
            )
            .scalar()
        ) or 0

        goal_savings = (
            db.query(func.sum(Goal.current_amount))
            .filter(Goal.user_id == current_user.id)
            .scalar()
        ) or 0

        available_balance = total_income - total_expense - goal_savings

        if contribution.amount > available_balance:
            raise HTTPException(
                status_code=400,
                detail="Insufficient Balance",
            )

    if action == "withdraw" and contribution.amount > goal.current_amount:
        raise HTTPException(
            status_code=400,
            detail="Insufficient Goal Savings",
        )

    today = date.today()

    if action == "add":
        goal.current_amount += contribution.amount
    else:
        goal.current_amount -= contribution.amount

    new_contribution = GoalContribution(
        user_id=current_user.id,
        goal_id=goal.id,
        amount=contribution.amount,
        action=action,
        date=today,
        created_at=today,
        transaction_id=None,
    )

    db.add(new_contribution)
    db.commit()
    db.refresh(new_contribution)

    return new_contribution


@router.get(
    "/{goal_id}/contributions",
    response_model=list[GoalContributionResponse],
)
def get_goal_contributions(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_goal_or_404(db, goal_id, current_user.id)

    return (
        db.query(GoalContribution)
        .filter(
            GoalContribution.goal_id == goal_id,
            GoalContribution.user_id == current_user.id,
        )
        .order_by(
            GoalContribution.created_at.desc(),
            GoalContribution.id.desc(),
        )
        .all()
    )


@router.get("/contributions/history/all")
def get_all_goal_contributions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    contributions = (
        db.query(GoalContribution, Goal.goal_name)
        .join(Goal, Goal.id == GoalContribution.goal_id)
        .filter(GoalContribution.user_id == current_user.id)
        .order_by(
            GoalContribution.created_at.desc(),
            GoalContribution.id.desc(),
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
            "created_at": contribution.created_at,
        }
        for contribution, goal_name in contributions
    ]


@router.delete("/{goal_id}")
def delete_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = get_goal_or_404(db, goal_id, current_user.id)

    (
        db.query(GoalContribution)
        .filter(
            GoalContribution.goal_id == goal_id,
            GoalContribution.user_id == current_user.id,
        )
        .delete()
    )

    db.delete(goal)
    db.commit()

    return {
        "message": "Goal deleted successfully",
    }
