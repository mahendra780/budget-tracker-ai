from sqlalchemy import Column, Integer, String, Float, Date

from app.database.database import Base


class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True)

    goal_name = Column(String, nullable=False)

    target_amount = Column(Float, nullable=False)

    current_amount = Column(
        Float,
        nullable=False,
        default=0
    )

    target_date = Column(Date, nullable=True)