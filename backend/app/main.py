from dotenv import load_dotenv
load_dotenv()

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database.database import Base, engine
from app.database.migrations import run_startup_migrations
from app.routes.transaction import router as transaction_router
from app.routes.budget import router as budget_router
from app.routes.goal import router as goal_router
from app.routes.ai import router as ai_router
from app.routes.recurring_transaction import router as recurring_router
from app.routes.auth import router as auth_router


Base.metadata.create_all(bind=engine)
run_startup_migrations()


app = FastAPI(
    title="Budget Tracker API",
    version="1.0.0"
)

# CORS Configuration
cors_origins = os.getenv(
    "CORS_ORIGIN",
    "http://localhost:5173"
)

allowed_origins = [
    origin.strip()
    for origin in cors_origins.split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(transaction_router)
app.include_router(budget_router)
app.include_router(goal_router)
app.include_router(ai_router)
app.include_router(recurring_router)
app.include_router(auth_router)

@app.get("/")
def root():
    return {
        "message": "Budget Tracker API Running"
    }
