from sqlalchemy import Column, Date, Float, ForeignKey, Integer, String

from app.database.database import Base


class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)

    goal_name = Column(String, nullable=False)

    target_amount = Column(Float, nullable=False)

    current_amount = Column(
        Float,
        nullable=False,
        default=0
    )

    target_date = Column(Date, nullable=True)
