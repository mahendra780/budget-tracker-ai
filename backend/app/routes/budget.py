from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.dependencies import get_db
from app.models.budget import Budget
from app.models.transaction import Transaction
from app.schemas.budget import (
    BudgetCreate,
    BudgetResponse
)

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

    existing_budget = (
        db.query(Budget)
        .filter(
            func.lower(Budget.category)
            == budget.category.lower()
        )
        .first()
    )

    if existing_budget:
        raise HTTPException(
            status_code=400,
            detail="Budget already exists for this category"
        )

    new_budget = Budget(
        category=budget.category.lower(),
        monthly_limit=budget.monthly_limit
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
    return db.query(Budget).all()


# Budget Status Analytics
@router.get("/status")
def budget_status(
    db: Session = Depends(get_db)
):
    budgets = db.query(Budget).all()

    result = []

    for budget in budgets:

        spent = (
            db.query(func.sum(Transaction.amount))
            .filter(
                func.lower(Transaction.category)
                == budget.category.lower(),
                Transaction.type == "expense"
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
            "percentage_used": round(
                percentage_used,
                2
            )
        })

    return result


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
            == updated_budget.category.lower(),
            Budget.id != budget_id
        )
        .first()
    )

    if duplicate_budget:
        raise HTTPException(
            status_code=400,
            detail="Budget already exists for this category"
        )

    budget.category = updated_budget.category.lower()
    budget.monthly_limit = updated_budget.monthly_limit

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

    db.delete(budget)
    db.commit()

    return {
        "message": "Budget deleted successfully"
    }