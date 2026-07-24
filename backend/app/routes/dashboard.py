from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.auth_dependencies import get_current_user
from app.database.dependencies import get_db
from app.models.user import User
from app.routes.ai import (
    ai_summary,
    monthly_trend,
    recommendations,
    spending_breakdown,
    top_categories,
)
from app.routes.budget import budget_status
from app.routes.goal import goal_progress
from app.routes.transaction import get_summary, get_transactions

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


@router.get("/overview")
def get_dashboard_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return {
        "summary": get_summary(db=db, current_user=current_user),
        "budgets": budget_status(db=db, current_user=current_user),
        "goals": goal_progress(db=db, current_user=current_user),
        "recent_transactions": get_transactions(
            db=db,
            current_user=current_user,
        ),
        "expense_breakdown": spending_breakdown(
            db=db,
            current_user=current_user,
        ),
        "monthly_trend": monthly_trend(
            db=db,
            current_user=current_user,
        ),
        "top_category": top_categories(
            db=db,
            current_user=current_user,
        ),
        "ai_summary": ai_summary(db=db, current_user=current_user),
        "recommendations": recommendations(
            db=db,
            current_user=current_user,
        ),
    }
