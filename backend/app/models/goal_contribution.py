from datetime import date as current_date

from sqlalchemy import Column, Date, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database.database import Base


class GoalContribution(Base):
    __tablename__ = "goal_contributions"

    id = Column(Integer, primary_key=True, index=True)
    goal_id = Column(Integer, ForeignKey("goals.id"), nullable=False)
    amount = Column(Float, nullable=False)
    action = Column(String, nullable=False)
    date = Column(Date, nullable=False, default=current_date.today)
    created_at = Column(Date, nullable=False, default=current_date.today)
    transaction_id = Column(
        Integer,
        ForeignKey("transactions.id"),
        nullable=True
    )

    goal = relationship("Goal")
    transaction = relationship("Transaction")
