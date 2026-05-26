from datetime import date

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.budget import Budget
from app.models.budget_template import BudgetTemplate
from app.models.transaction import Transaction
from app.services.category_service import normalize_category


def ensure_current_month_budgets(db: Session):
    current = date.today()
    templates = (
        db.query(BudgetTemplate)
        .filter(BudgetTemplate.auto_renew == True)  # noqa: E712
        .all()
    )

    for template in templates:
        existing_budget = (
            db.query(Budget)
            .filter(
                func.lower(Budget.category) == template.category.lower(),
                Budget.month == current.month,
                Budget.year == current.year,
            )
            .first()
        )

        if not existing_budget:
            db.add(
                Budget(
                    category=normalize_category(template.category),
                    monthly_limit=template.monthly_limit,
                    month=current.month,
                    year=current.year,
                )
            )

    db.commit()


def build_budget_status(db: Session, month: int, year: int):
    budgets = (
        db.query(Budget)
        .filter(Budget.month == month, Budget.year == year)
        .all()
    )

    result = []

    for budget in budgets:
        spent = (
            db.query(func.sum(Transaction.amount))
            .filter(
                func.lower(Transaction.category) == budget.category.lower(),
                Transaction.type == "expense",
                func.extract("month", Transaction.date) == month,
                func.extract("year", Transaction.date) == year,
            )
            .scalar()
        ) or 0

        remaining = budget.monthly_limit - spent

        percentage_used = (
            (spent / budget.monthly_limit) * 100
            if budget.monthly_limit > 0
            else 0
        )

        result.append({
            "id": budget.id,
            "category": budget.category,
            "limit": budget.monthly_limit,
            "spent": spent,
            "remaining": remaining,
            "percentage_used": round(percentage_used, 2),
            "month": budget.month,
            "year": budget.year,
        })

    return result
