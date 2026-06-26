from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.auth_dependencies import get_current_user
from app.database.dependencies import get_db
from app.models.recurring_transaction import RecurringTransaction
from app.models.user import User
from app.schemas.recurring_transaction import (
    RecurringTransactionCreate,
    RecurringTransactionResponse,
    RecurringTransactionUpdate,
    UpcomingRecurringTransactionResponse,
)
from app.services.category_service import normalize_category
from app.services.recurring_service import (
    build_upcoming_recurring_transactions,
    process_due_recurring_transactions,
)

router = APIRouter(
    prefix="/recurring-transactions",
    tags=["Recurring Transactions"],
)


def get_recurring_or_404(
    db: Session,
    recurring_id: int,
    user_id: int,
):
    recurring_item = (
        db.query(RecurringTransaction)
        .filter(
            RecurringTransaction.id == recurring_id,
            RecurringTransaction.user_id == user_id,
        )
        .first()
    )

    if not recurring_item:
        raise HTTPException(
            status_code=404,
            detail="Recurring transaction not found",
        )

    return recurring_item


@router.get("/", response_model=list[RecurringTransactionResponse])
def get_recurring_transactions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(RecurringTransaction)
        .filter(RecurringTransaction.user_id == current_user.id)
        .order_by(
            RecurringTransaction.active.desc(),
            RecurringTransaction.start_date.asc(),
            RecurringTransaction.id.desc(),
        )
        .all()
    )


@router.post("/", response_model=RecurringTransactionResponse)
def create_recurring_transaction(
    recurring_transaction: RecurringTransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    new_item = RecurringTransaction(
        user_id=current_user.id,
        title=recurring_transaction.title,
        amount=recurring_transaction.amount,
        type=recurring_transaction.type,
        category=normalize_category(recurring_transaction.category),
        frequency=recurring_transaction.frequency,
        start_date=recurring_transaction.start_date,
        end_date=recurring_transaction.end_date,
        last_processed_date=None,
        active=recurring_transaction.active,
    )

    db.add(new_item)
    db.commit()
    db.refresh(new_item)

    return new_item


@router.put("/{recurring_id}", response_model=RecurringTransactionResponse)
def update_recurring_transaction(
    recurring_id: int,
    updated_item: RecurringTransactionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    recurring_item = get_recurring_or_404(
        db,
        recurring_id,
        current_user.id,
    )

    recurring_item.title = updated_item.title
    recurring_item.amount = updated_item.amount
    recurring_item.type = updated_item.type
    recurring_item.category = normalize_category(updated_item.category)
    recurring_item.frequency = updated_item.frequency
    recurring_item.start_date = updated_item.start_date
    recurring_item.end_date = updated_item.end_date
    recurring_item.last_processed_date = updated_item.last_processed_date
    recurring_item.active = updated_item.active

    db.commit()
    db.refresh(recurring_item)

    return recurring_item


@router.delete("/{recurring_id}")
def delete_recurring_transaction(
    recurring_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    recurring_item = get_recurring_or_404(
        db,
        recurring_id,
        current_user.id,
    )

    db.delete(recurring_item)
    db.commit()

    return {
        "message": "Recurring transaction deleted successfully",
    }


@router.patch("/{recurring_id}/toggle", response_model=RecurringTransactionResponse)
def toggle_recurring_transaction(
    recurring_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    recurring_item = get_recurring_or_404(
        db,
        recurring_id,
        current_user.id,
    )
    recurring_item.active = not recurring_item.active

    db.commit()
    db.refresh(recurring_item)

    return recurring_item


@router.post("/process")
def process_recurring_transactions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    generated = process_due_recurring_transactions(
        db,
        user_id=current_user.id,
    )

    return {
        "generated_count": len(generated),
    }


@router.get(
    "/upcoming",
    response_model=list[UpcomingRecurringTransactionResponse],
)
def upcoming_recurring_transactions(
    limit: int = 5,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return build_upcoming_recurring_transactions(
        db,
        limit,
        current_user.id,
    )
