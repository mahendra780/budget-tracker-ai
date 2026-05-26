from datetime import date, timedelta

from sqlalchemy.orm import Session

from app.models.recurring_transaction import RecurringTransaction
from app.models.transaction import Transaction
from app.services.category_service import normalize_category


def calculate_next_due_date(current_due_date: date, frequency: str) -> date:
    normalized_frequency = frequency.lower()

    if normalized_frequency == "daily":
        return current_due_date + timedelta(days=1)

    if normalized_frequency == "weekly":
        return current_due_date + timedelta(weeks=1)

    if normalized_frequency == "monthly":
        month = current_due_date.month + 1
        year = current_due_date.year

        if month > 12:
            month = 1
            year += 1

        next_day = min(current_due_date.day, 28)
        return date(year, month, next_day)

    return current_due_date


def process_due_recurring_transactions(db: Session):
    today = date.today()
    generated = []

    recurring_items = (
        db.query(RecurringTransaction)
        .filter(
            RecurringTransaction.is_active == True,  # noqa: E712
            RecurringTransaction.next_due_date <= today,
        )
        .all()
    )

    for item in recurring_items:
        while item.next_due_date <= today and item.is_active:
            existing_transaction = (
                db.query(Transaction)
                .filter(
                    Transaction.title == f"Recurring - {item.title}",
                    Transaction.amount == item.amount,
                    Transaction.type == item.type,
                    Transaction.category == item.category,
                    Transaction.date == item.next_due_date,
                )
                .first()
            )

            if not existing_transaction:
                transaction = Transaction(
                    title=f"Recurring - {item.title}",
                    amount=item.amount,
                    type=item.type,
                    category=normalize_category(item.category),
                    date=item.next_due_date,
                )
                db.add(transaction)
                generated.append(transaction)

            item.next_due_date = calculate_next_due_date(
                item.next_due_date,
                item.frequency,
            )

    db.commit()

    return generated
