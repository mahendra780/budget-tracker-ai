from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.dependencies import get_db
from app.models.budget import Budget
from app.schemas.budget import (
    BudgetCreate,
    BudgetResponse
)
from app.services.budget_service import (
    build_budget_history,
    build_budget_status,
    disable_budget_template,
    ensure_current_month_budgets,
    ensure_transaction_month_budgets,
    upsert_budget_template,
)
from app.services.category_service import normalize_category

router = APIRouter(
    prefix="/budgets",
    tags=["Budgets"]
)


# Create Budget
@router.post("/", response_model=BudgetResponse)
def create_budget(
    budget: BudgetCreate,
    db: Session = Depends(get_db)
):
    current = date.today()
    ensure_current_month_budgets(db, current)
    category = normalize_category(budget.category)

    existing_budget = (
        db.query(Budget)
        .filter(
            func.lower(Budget.category)
            == category.lower(),
            Budget.month == current.month,
            Budget.year == current.year,
        )
        .first()
    )

    if existing_budget:
        raise HTTPException(
            status_code=400,
            detail="Budget already exists for this category"
        )

    new_budget = Budget(
        category=category,
        monthly_limit=budget.monthly_limit,
        month=current.month,
        year=current.year,
    )

    upsert_budget_template(
        db,
        category,
        budget.monthly_limit,
        auto_renew=True,
    )
    db.add(new_budget)
    db.commit()
    db.refresh(new_budget)

    return new_budget


# Get All Budgets
@router.get("/", response_model=list[BudgetResponse])
def get_budgets(
    db: Session = Depends(get_db)
):
    current = date.today()
    ensure_current_month_budgets(db, current)
    ensure_transaction_month_budgets(db)

    return db.query(Budget).all()


# Budget Status Analytics
@router.get("/status")
def budget_status(
    month: int | None = None,
    year: int | None = None,
    db: Session = Depends(get_db)
):
    current = date.today()
    ensure_current_month_budgets(db, current)
    ensure_transaction_month_budgets(db)
    selected_month = month or current.month
    selected_year = year or current.year

    return build_budget_status(
        db,
        selected_month,
        selected_year,
    )


@router.get("/history")
def budget_history(
    db: Session = Depends(get_db)
):
    current = date.today()
    ensure_current_month_budgets(db, current)
    ensure_transaction_month_budgets(db)

    return build_budget_history(db)


# Get Single Budget
@router.get("/{budget_id}",
            response_model=BudgetResponse)
def get_budget(
    budget_id: int,
    db: Session = Depends(get_db)
):
    budget = (
        db.query(Budget)
        .filter(Budget.id == budget_id)
        .first()
    )

    if not budget:
        raise HTTPException(
            status_code=404,
            detail="Budget not found"
        )

    return budget


# Update Budget
@router.put("/{budget_id}",
            response_model=BudgetResponse)
def update_budget(
    budget_id: int,
    updated_budget: BudgetCreate,
    db: Session = Depends(get_db)
):
    budget = (
        db.query(Budget)
        .filter(Budget.id == budget_id)
        .first()
    )

    if not budget:
        raise HTTPException(
            status_code=404,
            detail="Budget not found"
        )

    duplicate_budget = (
        db.query(Budget)
        .filter(
            func.lower(Budget.category)
            == normalize_category(updated_budget.category).lower(),
            Budget.id != budget_id,
            Budget.month == budget.month,
            Budget.year == budget.year,
        )
        .first()
    )

    if duplicate_budget:
        raise HTTPException(
            status_code=400,
            detail="Budget already exists for this category"
        )

    old_category = budget.category
    new_category = normalize_category(updated_budget.category)

    budget.category = new_category
    budget.monthly_limit = updated_budget.monthly_limit

    if old_category.lower() != new_category.lower():
        disable_budget_template(db, old_category)

    upsert_budget_template(
        db,
        new_category,
        updated_budget.monthly_limit,
        auto_renew=True,
    )
    db.commit()
    db.refresh(budget)

    return budget


# Delete Budget
@router.delete("/{budget_id}")
def delete_budget(
    budget_id: int,
    db: Session = Depends(get_db)
):
    budget = (
        db.query(Budget)
        .filter(Budget.id == budget_id)
        .first()
    )

    if not budget:
        raise HTTPException(
            status_code=404,
            detail="Budget not found"
        )

    disable_budget_template(db, budget.category)
    db.delete(budget)
    db.commit()

    return {
        "message": "Budget deleted successfully"
    }
