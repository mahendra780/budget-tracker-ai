from datetime import date

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.budget import Budget
from app.models.budget_template import BudgetTemplate
from app.models.goal_contribution import GoalContribution
from app.models.transaction import Transaction
from app.services.category_service import normalize_category


def ensure_current_month_budgets(
    db: Session,
    current: date | None = None,
    user_id: int | None = None,
):
    current = current or date.today()
    ensure_budget_month(db, current.month, current.year, user_id)


def ensure_budget_templates_from_existing_budgets(
    db: Session,
    user_id: int | None = None,
):
    template_query = db.query(BudgetTemplate.category)
    budget_query = db.query(Budget)

    if user_id is not None:
        template_query = template_query.filter(BudgetTemplate.user_id == user_id)
        budget_query = budget_query.filter(Budget.user_id == user_id)

    existing_templates = {
        template_category.lower()
        for (template_category,) in template_query.all()
    }

    existing_budgets = (
        budget_query
        .order_by(
            Budget.year.desc(),
            Budget.month.desc(),
            Budget.id.desc(),
        )
        .all()
    )

    seeded_categories = set(existing_templates)
    seeded_template = False

    for budget in existing_budgets:
        normalized_category = normalize_category(budget.category)
        category_key = normalized_category.lower()

        if category_key in seeded_categories:
            continue

        db.add(
                BudgetTemplate(
                    user_id=user_id,
                    category=normalized_category,
                    monthly_limit=budget.monthly_limit,
                auto_renew=True,
            )
        )
        seeded_categories.add(category_key)
        seeded_template = True

    if seeded_template:
        db.flush()


def ensure_budget_month(
    db: Session,
    month: int,
    year: int,
    user_id: int | None = None,
):
    ensure_budget_templates_from_existing_budgets(db, user_id)

    template_query = db.query(BudgetTemplate).filter(
        BudgetTemplate.auto_renew == True  # noqa: E712
    )

    if user_id is not None:
        template_query = template_query.filter(BudgetTemplate.user_id == user_id)

    templates = template_query.all()

    for template in templates:
        existing_budget = (
            db.query(Budget)
            .filter(
                func.lower(Budget.category) == template.category.lower(),
                Budget.month == month,
                Budget.year == year,
                Budget.user_id == user_id,
            )
            .first()
        )

        if not existing_budget:
            db.add(
                Budget(
                    user_id=user_id,
                    category=normalize_category(template.category),
                    monthly_limit=template.monthly_limit,
                    month=month,
                    year=year,
                )
            )

    db.commit()


def ensure_transaction_month_budgets(
    db: Session,
    user_id: int | None = None,
):
    transaction_query = db.query(Transaction.date).filter(
        Transaction.type == "expense"
    )

    if user_id is not None:
        transaction_query = transaction_query.filter(Transaction.user_id == user_id)

    transaction_dates = transaction_query.all()

    periods = {
        (transaction_date.month, transaction_date.year)
        for (transaction_date,) in transaction_dates
        if transaction_date
    }

    for month, year in periods:
        ensure_budget_month(db, month, year, user_id)


def goal_transaction_ids(db: Session, user_id: int | None = None):
    query = db.query(GoalContribution.transaction_id).filter(
        GoalContribution.transaction_id.isnot(None)
    )

    if user_id is not None:
        query = query.filter(GoalContribution.user_id == user_id)

    return query


def upsert_budget_template(
    db: Session,
    category: str,
    monthly_limit: float,
    auto_renew: bool = True,
    user_id: int | None = None,
):
    normalized_category = normalize_category(category)

    template = (
        db.query(BudgetTemplate)
        .filter(
            func.lower(BudgetTemplate.category)
            == normalized_category.lower(),
            BudgetTemplate.user_id == user_id,
        )
        .first()
    )

    if template:
        template.category = normalized_category
        template.monthly_limit = monthly_limit
        template.auto_renew = auto_renew
    else:
        template = BudgetTemplate(
            user_id=user_id,
            category=normalized_category,
            monthly_limit=monthly_limit,
            auto_renew=auto_renew,
        )
        db.add(template)

    return template


def disable_budget_template(
    db: Session,
    category: str,
    user_id: int | None = None,
):
    template = (
        db.query(BudgetTemplate)
        .filter(
            func.lower(BudgetTemplate.category)
            == category.lower(),
            BudgetTemplate.user_id == user_id,
        )
        .first()
    )

    if template:
        template.auto_renew = False


def build_budget_status(
    db: Session,
    month: int,
    year: int,
    user_id: int | None = None,
):
    budgets = (
        db.query(Budget)
        .filter(
            Budget.month == month,
            Budget.year == year,
            Budget.user_id == user_id,
        )
        .all()
    )

    result = []

    for budget in budgets:
        spent = (
            db.query(func.sum(Transaction.amount))
            .filter(
                func.lower(Transaction.category) == budget.category.lower(),
                Transaction.type == "expense",
                Transaction.user_id == user_id,
                func.extract("month", Transaction.date) == month,
                func.extract("year", Transaction.date) == year,
                ~Transaction.id.in_(goal_transaction_ids(db, user_id)),
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


def build_budget_history(db: Session, user_id: int | None = None):
    budgets = (
        db.query(Budget)
        .filter(Budget.user_id == user_id)
        .order_by(
            Budget.year.desc(),
            Budget.month.desc(),
            func.lower(Budget.category).asc(),
        )
        .all()
    )

    result = []

    for budget in budgets:
        spent = (
            db.query(func.sum(Transaction.amount))
            .filter(
                func.lower(Transaction.category) == budget.category.lower(),
                Transaction.type == "expense",
                Transaction.user_id == user_id,
                func.extract("month", Transaction.date) == budget.month,
                func.extract("year", Transaction.date) == budget.year,
                ~Transaction.id.in_(goal_transaction_ids(db, user_id)),
            )
            .scalar()
        ) or 0

        result.append({
            "period": f"{budget.year}-{budget.month:02d}",
            "category": budget.category,
            "limit": budget.monthly_limit,
            "spent": spent,
            "remaining": budget.monthly_limit - spent,
            "month": budget.month,
            "year": budget.year,
        })

    return result
