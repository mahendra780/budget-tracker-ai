from sqlalchemy import Column, Integer, String, Float

from app.database.database import Base


class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)

    category = Column(String, nullable=False)

    monthly_limit = Column(Float, nullable=False)