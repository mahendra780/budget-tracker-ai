from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


from app.database.database import Base, engine
from app.routes.transaction import router as transaction_router
from app.routes.budget import router as budget_router
from app.routes.goal import router as goal_router
from app.routes.ai import router as ai_router


Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="Budget Tracker API",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(transaction_router)
app.include_router(budget_router)
app.include_router(goal_router)
app.include_router(ai_router)

@app.get("/")
def root():
    return {
        "message": "Budget Tracker API Running"
    }