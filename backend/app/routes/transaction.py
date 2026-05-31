from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.dependencies import get_db
from app.models.goal import Goal
from app.models.goal_contribution import GoalContribution
from app.models.transaction import Transaction
from app.schemas.transaction import (
    TransactionCreate,
    TransactionResponse
)

router = APIRouter(
    prefix="/transactions",
    tags=["Transactions"]
)


# Create Transaction
@router.post("/", response_model=TransactionResponse)
def create_transaction(
    transaction: TransactionCreate,
    db: Session = Depends(get_db)
):
    new_transaction = Transaction(
        title=transaction.title,
        amount=transaction.amount,
        type=transaction.type,
        category=transaction.category,
        date=transaction.date
    )

    db.add(new_transaction)
    db.commit()
    db.refresh(new_transaction)

    return new_transaction
@router.get("/summary")
def get_summary(db: Session = Depends(get_db)):
    goal_transaction_ids = (
        db.query(GoalContribution.transaction_id)
        .filter(GoalContribution.transaction_id.isnot(None))
    )

    total_income = (
        db.query(func.sum(Transaction.amount))
        .filter(
            Transaction.type == "income",
            ~Transaction.id.in_(goal_transaction_ids)
        )
        .scalar()
    ) or 0

    total_expense = (
        db.query(func.sum(Transaction.amount))
        .filter(
            Transaction.type == "expense",
            ~Transaction.id.in_(goal_transaction_ids)
        )
        .scalar()
    ) or 0

    goal_savings = (
        db.query(func.sum(Goal.current_amount))
        .scalar()
    ) or 0

    balance = total_income - total_expense - goal_savings

    return {
        "total_income": total_income,
        "total_expense": total_expense,
        "goal_savings": goal_savings,
        "balance": balance
    }
@router.get("/category-summary")
def category_summary(db: Session = Depends(get_db)):
    goal_transaction_ids = (
        db.query(GoalContribution.transaction_id)
        .filter(GoalContribution.transaction_id.isnot(None))
    )

    results = (
        db.query(
            Transaction.category,
            func.sum(Transaction.amount)
        )
        .filter(
            Transaction.type == "expense",
            ~Transaction.id.in_(goal_transaction_ids)
        )
        .group_by(Transaction.category)
        .all()
    )

    return [
        {
            "category": category,
            "amount": amount
        }
        for category, amount in results
    ]

# Get All Transactions
@router.get("/", response_model=list[TransactionResponse])
def get_transactions(
    db: Session = Depends(get_db)
):
    transactions = db.query(Transaction).all()
    return transactions


# Get Single Transaction
@router.get("/{transaction_id}",
            response_model=TransactionResponse)
def get_transaction(
    transaction_id: int,
    db: Session = Depends(get_db)
):
    transaction = (
        db.query(Transaction)
        .filter(Transaction.id == transaction_id)
        .first()
    )

    if not transaction:
        raise HTTPException(
            status_code=404,
            detail="Transaction not found"
        )

    return transaction


# Update Transaction
@router.put("/{transaction_id}",
            response_model=TransactionResponse)
def update_transaction(
    transaction_id: int,
    updated_data: TransactionCreate,
    db: Session = Depends(get_db)
):
    transaction = (
        db.query(Transaction)
        .filter(Transaction.id == transaction_id)
        .first()
    )

    if not transaction:
        raise HTTPException(
            status_code=404,
            detail="Transaction not found"
        )

    transaction.title = updated_data.title
    transaction.amount = updated_data.amount
    transaction.type = updated_data.type
    transaction.category = updated_data.category
    transaction.date = updated_data.date

    db.commit()
    db.refresh(transaction)

    return transaction


# Delete Transaction
@router.delete("/{transaction_id}")
def delete_transaction(
    transaction_id: int,
    db: Session = Depends(get_db)
):
    transaction = (
        db.query(Transaction)
        .filter(Transaction.id == transaction_id)
        .first()
    )

    if not transaction:
        raise HTTPException(
            status_code=404,
            detail="Transaction not found"
        )

    db.delete(transaction)
    db.commit()

    return {
        "message": "Transaction deleted successfully"
    }
