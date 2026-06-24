from calendar import monthrange
from datetime import date, timedelta

from sqlalchemy.orm import Session

from app.models.recurring_transaction import RecurringTransaction
from app.models.transaction import Transaction
from app.services.budget_service import ensure_budget_month
from app.services.category_service import normalize_category


def add_months(current_date: date, months: int) -> date:
    month_index = current_date.month - 1 + months
    year = current_date.year + month_index // 12
    month = month_index % 12 + 1
    day = min(current_date.day, monthrange(year, month)[1])

    return date(year, month, day)


def calculate_next_occurrence(current_date: date, frequency: str) -> date:
    normalized_frequency = frequency.lower()

    if normalized_frequency == "daily":
        return current_date + timedelta(days=1)

    if normalized_frequency == "weekly":
        return current_date + timedelta(weeks=1)

    if normalized_frequency == "monthly":
        return add_months(current_date, 1)

    if normalized_frequency == "yearly":
        return add_months(current_date, 12)

    raise ValueError("Unsupported recurring frequency")


def get_next_due_date(item: RecurringTransaction) -> date | None:
    next_due_date = (
        calculate_next_occurrence(
            item.last_processed_date,
            item.frequency,
        )
        if item.last_processed_date
        else item.start_date
    )

    if item.end_date and next_due_date > item.end_date:
        return None

    return next_due_date


def transaction_exists_for_occurrence(
    db: Session,
    item: RecurringTransaction,
    occurrence_date: date,
):
    return (
        db.query(Transaction)
        .filter(
            Transaction.title == f"Recurring - {item.title}",
            Transaction.amount == item.amount,
            Transaction.type == item.type,
            Transaction.category == item.category,
            Transaction.date == occurrence_date,
        )
        .first()
    )


def create_transaction_for_occurrence(
    db: Session,
    item: RecurringTransaction,
    occurrence_date: date,
):
    if item.type == "expense":
        ensure_budget_month(
            db,
            occurrence_date.month,
            occurrence_date.year,
        )

    transaction = Transaction(
        title=f"Recurring - {item.title}",
        amount=item.amount,
        type=item.type,
        category=normalize_category(item.category),
        date=occurrence_date,
    )
    db.add(transaction)

    return transaction


def process_due_recurring_transactions(
    db: Session,
    current_date: date | None = None,
):
    today = current_date or date.today()
    generated = []

    recurring_items = (
        db.query(RecurringTransaction)
        .filter(RecurringTransaction.active == True)  # noqa: E712
        .all()
    )

    for item in recurring_items:
        occurrence_date = get_next_due_date(item)

        while occurrence_date and occurrence_date <= today:
            existing_transaction = transaction_exists_for_occurrence(
                db,
                item,
                occurrence_date,
            )

            if not existing_transaction:
                generated.append(
                    create_transaction_for_occurrence(
                        db,
                        item,
                        occurrence_date,
                    )
                )

            item.last_processed_date = occurrence_date
            occurrence_date = get_next_due_date(item)

    db.commit()

    return generated


def build_upcoming_recurring_transactions(
    db: Session,
    limit: int = 5,
):
    items = (
        db.query(RecurringTransaction)
        .filter(RecurringTransaction.active == True)  # noqa: E712
        .all()
    )

    upcoming = []

    for item in items:
        next_due_date = get_next_due_date(item)
        if not next_due_date:
            continue

        upcoming.append(
            {
                "id": item.id,
                "title": item.title,
                "amount": item.amount,
                "type": item.type,
                "category": item.category,
                "frequency": item.frequency,
                "start_date": item.start_date,
                "end_date": item.end_date,
                "last_processed_date": item.last_processed_date,
                "active": item.active,
                "next_due_date": next_due_date,
            }
        )

    return sorted(
        upcoming,
        key=lambda item: item["next_due_date"],
    )[:limit]
