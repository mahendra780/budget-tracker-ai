from sqlalchemy import Column, Float, Integer, String

from app.database.database import Base


class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)

    category = Column(String, nullable=False)

    monthly_limit = Column(Float, nullable=False)

    month = Column(Integer, nullable=False)

    year = Column(Integer, nullable=False)
