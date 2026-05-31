from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.models.budget import Budget
from app.database.dependencies import get_db
from app.models.goal_contribution import GoalContribution
from app.models.transaction import Transaction
import pandas as pd
from app.services.analytics_service import (
    transactions_to_dataframe
)

router = APIRouter(
    prefix="/ai",
    tags=["AI Insights"]
)


def goal_transaction_ids(db: Session):
    return (
        db.query(GoalContribution.transaction_id)
        .filter(GoalContribution.transaction_id.isnot(None))
    )


@router.get("/top-categories")
def top_categories(
    db: Session = Depends(get_db)
):

    transactions = (
        db.query(Transaction)
        .filter(
            Transaction.type == "expense",
            ~Transaction.id.in_(goal_transaction_ids(db))
        )
        .all()
    )

    if not transactions:
        return {
            "message": "No expense data available"
        }

    df = transactions_to_dataframe(
        transactions
    )

    grouped = (
        df.groupby("category")["amount"]
        .sum()
        .sort_values(
            ascending=False
        )
    )

    top_category = grouped.index[0]
    amount = float(grouped.iloc[0])

    return {
        "top_category": top_category,
        "amount": amount
    }

@router.get("/spending-breakdown")
def spending_breakdown(
    db: Session = Depends(get_db)
):

    transactions = (
        db.query(Transaction)
        .filter(
            Transaction.type == "expense",
            ~Transaction.id.in_(goal_transaction_ids(db))
        )
        .all()
    )

    if not transactions:
        return []

    df = transactions_to_dataframe(
        transactions
    )

    grouped = (
        df.groupby("category")["amount"]
        .sum()
        .reset_index()
    )

    return grouped.to_dict(
        orient="records"
    )

@router.get("/recommendations")
def recommendations(
    db: Session = Depends(get_db)
):

    recommendations = []

    budgets = db.query(Budget).all()

    for budget in budgets:

        expenses = (
            db.query(Transaction)
            .filter(
                Transaction.type == "expense",
                Transaction.category == budget.category,
                ~Transaction.id.in_(goal_transaction_ids(db))
            )
            .all()
        )

        total_spent = sum(
            expense.amount
            for expense in expenses
        )

        usage_percentage = (
            total_spent
            / budget.monthly_limit
        ) * 100

        if usage_percentage >= 90:

            recommendations.append({
                "type": "warning",
                "message":
                f"{budget.category} budget is {usage_percentage:.0f}% used"
            })

        elif usage_percentage >= 70:

            recommendations.append({
                "type": "info",
                "message":
                f"{budget.category} budget reached {usage_percentage:.0f}%"
            })

    if not recommendations:

        recommendations.append({
            "type": "success",
            "message":
            "All budgets are under control"
        })

    return recommendations

@router.get("/monthly-trend")
def monthly_trend(
    db: Session = Depends(get_db)
):
    transactions = (
        db.query(Transaction)
        .filter(
            Transaction.type == "expense",
            ~Transaction.id.in_(goal_transaction_ids(db))
        )
        .all()
    )

    if not transactions:
        return []

    data = []

    for t in transactions:
        data.append({
            "month": t.date.strftime("%Y-%m"),
            "amount": t.amount
        })

    df = pd.DataFrame(data)

    trend = (
        df.groupby("month")["amount"]
        .sum()
        .reset_index()
        .sort_values("month")
    )

    return trend.to_dict(
        orient="records"
    )

@router.get("/summary")
def ai_summary(
    db: Session = Depends(get_db)
):
    transactions = (
        db.query(Transaction)
        .filter(
            Transaction.type == "expense",
            ~Transaction.id.in_(goal_transaction_ids(db))
        )
        .all()
    )

    if not transactions:
        return {
            "summary": [
                "No expense data available."
            ]
        }

    df = transactions_to_dataframe(
        transactions
    )

    category_totals = (
        df.groupby("category")["amount"]
        .sum()
        .sort_values(
            ascending=False
        )
    )

    total_expense = float(
        category_totals.sum()
    )

    top_category = (
        category_totals.index[0]
    )

    top_amount = float(
        category_totals.iloc[0]
    )

    top_percentage = round(
        (top_amount / total_expense) * 100,
        2
    )

    summary = []

    summary.append(
        f"{top_category} is your highest spending category."
    )

    summary.append(
        f"You spent ₹{top_amount:.0f} on {top_category}."
    )

    summary.append(
        f"{top_category} accounts for {top_percentage}% of your total expenses."
    )

    if top_percentage > 60:
        summary.append(
            "Your spending is heavily concentrated in one category."
        )

    summary.append(
        f"Total recorded expenses: ₹{total_expense:.0f}"
    )

    return {
        "summary": summary
    }
