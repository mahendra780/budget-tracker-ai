from datetime import date

import pandas as pd
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database.auth_dependencies import get_current_user
from app.database.dependencies import get_db
from app.models.budget import Budget
from app.models.goal_contribution import GoalContribution
from app.models.transaction import Transaction
from app.models.user import User
from app.services.analytics_service import transactions_to_dataframe
from app.services.budget_service import ensure_current_month_budgets

router = APIRouter(
    prefix="/ai",
    tags=["AI Insights"],
)


def goal_transaction_ids(db: Session, user_id: int):
    return (
        db.query(GoalContribution.transaction_id)
        .filter(
            GoalContribution.transaction_id.isnot(None),
            GoalContribution.user_id == user_id,
        )
    )


@router.get("/top-categories")
def top_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    transactions = (
        db.query(Transaction)
        .filter(
            Transaction.type == "expense",
            Transaction.user_id == current_user.id,
            ~Transaction.id.in_(goal_transaction_ids(db, current_user.id)),
        )
        .all()
    )

    if not transactions:
        return {
            "message": "No expense data available",
        }

    df = transactions_to_dataframe(transactions)

    grouped = (
        df.groupby("category")["amount"]
        .sum()
        .sort_values(ascending=False)
    )

    top_category = grouped.index[0]
    amount = float(grouped.iloc[0])

    return {
        "top_category": top_category,
        "amount": amount,
    }


@router.get("/spending-breakdown")
def spending_breakdown(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    transactions = (
        db.query(Transaction)
        .filter(
            Transaction.type == "expense",
            Transaction.user_id == current_user.id,
            ~Transaction.id.in_(goal_transaction_ids(db, current_user.id)),
        )
        .all()
    )

    if not transactions:
        return []

    df = transactions_to_dataframe(transactions)

    grouped = (
        df.groupby("category")["amount"]
        .sum()
        .reset_index()
    )

    return grouped.to_dict(orient="records")


@router.get("/recommendations")
def recommendations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    recommendations = []
    current = date.today()

    ensure_current_month_budgets(db, current, current_user.id)

    budgets = (
        db.query(Budget)
        .filter(
            Budget.month == current.month,
            Budget.year == current.year,
            Budget.user_id == current_user.id,
        )
        .all()
    )

    for budget in budgets:
        expenses = (
            db.query(Transaction)
            .filter(
                Transaction.type == "expense",
                Transaction.user_id == current_user.id,
                Transaction.category == budget.category,
                func.extract("month", Transaction.date) == current.month,
                func.extract("year", Transaction.date) == current.year,
                ~Transaction.id.in_(goal_transaction_ids(db, current_user.id)),
            )
            .all()
        )

        total_spent = sum(expense.amount for expense in expenses)

        if budget.monthly_limit <= 0:
            recommendations.append({
                "type": "warning",
                "message": f"{budget.category} has an invalid budget limit",
            })
            continue

        usage_percentage = (total_spent / budget.monthly_limit) * 100

        if usage_percentage >= 90:
            recommendations.append({
                "type": "warning",
                "message": (
                    f"{budget.category} budget is "
                    f"{usage_percentage:.0f}% used"
                ),
            })
        elif usage_percentage >= 70:
            recommendations.append({
                "type": "info",
                "message": (
                    f"{budget.category} budget reached "
                    f"{usage_percentage:.0f}%"
                ),
            })

    if not recommendations:
        recommendations.append({
            "type": "success",
            "message": "All budgets are under control",
        })

    return recommendations


@router.get("/monthly-trend")
def monthly_trend(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    transactions = (
        db.query(Transaction)
        .filter(
            Transaction.type == "expense",
            Transaction.user_id == current_user.id,
            ~Transaction.id.in_(goal_transaction_ids(db, current_user.id)),
        )
        .all()
    )

    if not transactions:
        return []

    data = []

    for transaction in transactions:
        data.append({
            "month": transaction.date.strftime("%Y-%m"),
            "amount": transaction.amount,
        })

    df = pd.DataFrame(data)

    trend = (
        df.groupby("month")["amount"]
        .sum()
        .reset_index()
        .sort_values("month")
    )

    return trend.to_dict(orient="records")


@router.get("/summary")
def ai_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    transactions = (
        db.query(Transaction)
        .filter(
            Transaction.type == "expense",
            Transaction.user_id == current_user.id,
            ~Transaction.id.in_(goal_transaction_ids(db, current_user.id)),
        )
        .all()
    )

    if not transactions:
        return {
            "summary": [
                "No expense data available.",
            ],
        }

    df = transactions_to_dataframe(transactions)

    category_totals = (
        df.groupby("category")["amount"]
        .sum()
        .sort_values(ascending=False)
    )

    total_expense = float(category_totals.sum())
    top_category = category_totals.index[0]
    top_amount = float(category_totals.iloc[0])
    top_percentage = round((top_amount / total_expense) * 100, 2)

    summary = [
        f"{top_category} is your highest spending category.",
        f"You spent Rs.{top_amount:.0f} on {top_category}.",
        (
            f"{top_category} accounts for {top_percentage}% "
            "of your total expenses."
        ),
    ]

    if top_percentage > 60:
        summary.append(
            "Your spending is heavily concentrated in one category."
        )

    summary.append(f"Total recorded expenses: Rs.{total_expense:.0f}")

    return {
        "summary": summary,
    }
