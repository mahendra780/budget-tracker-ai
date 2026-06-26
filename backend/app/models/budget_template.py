from sqlalchemy import Boolean, Column, Float, ForeignKey, Integer, String

from app.database.database import Base


class BudgetTemplate(Base):
    __tablename__ = "budget_templates"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    category = Column(String, nullable=False)
    monthly_limit = Column(Float, nullable=False)
    auto_renew = Column(Boolean, nullable=False, default=True)
