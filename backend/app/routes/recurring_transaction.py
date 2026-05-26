from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.dependencies import get_db
from app.models.recurring_transaction import RecurringTransaction
from app.schemas.recurring_transaction import (
    RecurringTransactionCreate,
    RecurringTransactionResponse,
    RecurringTransactionUpdate
)
from app.services.category_service import normalize_category
from app.services.recurring_service import process_due_recurring_transactions

router = APIRouter(
    prefix="/recurring-transactions",
    tags=["Recurring Transactions"]
)


@router.post("/", response_model=RecurringTransactionResponse)
def create_recurring_transaction(
    recurring_transaction: RecurringTransactionCreate,
    db: Session = Depends(get_db)
):
    new_item = RecurringTransaction(
        title=recurring_transaction.title,
        amount=recurring_transaction.amount,
        type=recurring_transaction.type,
        category=normalize_category(recurring_transaction.category),
        frequency=recurring_transaction.frequency,
        next_due_date=recurring_transaction.next_due_date,
        is_active=recurring_transaction.is_active,
    )

    db.add(new_item)
    db.commit()
    db.refresh(new_item)

    return new_item


@router.get("/", response_model=list[RecurringTransactionResponse])
def get_recurring_transactions(
    db: Session = Depends(get_db)
):
    return (
        db.query(RecurringTransaction)
        .order_by(RecurringTransaction.next_due_date)
        .all()
    )


@router.post("/process")
def process_recurring_transactions(
    db: Session = Depends(get_db)
):
    generated = process_due_recurring_transactions(db)

    return {
        "generated_count": len(generated)
    }


@router.get("/upcoming")
def upcoming_recurring_transactions(
    limit: int = 5,
    db: Session = Depends(get_db)
):
    return (
        db.query(RecurringTransaction)
        .filter(RecurringTransaction.is_active == True)  # noqa: E712
        .order_by(RecurringTransaction.next_due_date)
        .limit(limit)
        .all()
    )


@router.put("/{recurring_id}", response_model=RecurringTransactionResponse)
def update_recurring_transaction(
    recurring_id: int,
    updated_item: RecurringTransactionUpdate,
    db: Session = Depends(get_db)
):
    recurring_item = (
        db.query(RecurringTransaction)
        .filter(RecurringTransaction.id == recurring_id)
        .first()
    )

    if not recurring_item:
        raise HTTPException(
            status_code=404,
            detail="Recurring transaction not found"
        )

    recurring_item.title = updated_item.title
    recurring_item.amount = updated_item.amount
    recurring_item.type = updated_item.type
    recurring_item.category = normalize_category(updated_item.category)
    recurring_item.frequency = updated_item.frequency
    recurring_item.next_due_date = updated_item.next_due_date
    recurring_item.is_active = updated_item.is_active

    db.commit()
    db.refresh(recurring_item)

    return recurring_item


@router.patch("/{recurring_id}/toggle", response_model=RecurringTransactionResponse)
def toggle_recurring_transaction(
    recurring_id: int,
    db: Session = Depends(get_db)
):
    recurring_item = (
        db.query(RecurringTransaction)
        .filter(RecurringTransaction.id == recurring_id)
        .first()
    )

    if not recurring_item:
        raise HTTPException(
            status_code=404,
            detail="Recurring transaction not found"
        )

    recurring_item.is_active = not recurring_item.is_active

    db.commit()
    db.refresh(recurring_item)

    return recurring_item


@router.delete("/{recurring_id}")
def delete_recurring_transaction(
    recurring_id: int,
    db: Session = Depends(get_db)
):
    recurring_item = (
        db.query(RecurringTransaction)
        .filter(RecurringTransaction.id == recurring_id)
        .first()
    )

    if not recurring_item:
        raise HTTPException(
            status_code=404,
            detail="Recurring transaction not found"
        )

    db.delete(recurring_item)
    db.commit()

    return {
        "message": "Recurring transaction deleted successfully"
    }
