from sqlalchemy import Boolean, Column, Date, Float, Integer, String

from app.database.database import Base


class RecurringTransaction(Base):
    __tablename__ = "recurring_transactions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    type = Column(String, nullable=False)
    category = Column(String, nullable=False)
    frequency = Column(String, nullable=False)
    next_due_date = Column(Date, nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
