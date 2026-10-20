import os
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
from app.database import engine, Base, SessionLocal
from app.models.entities import User
from app.services.auth_service import get_password_hash
from app.api.auth import router as auth_router
from app.api.assessments import router as assessment_router, assessments_list_router
from app.api.predictions import router as predictions_router
from app.api.recommendations import router as recommendations_router
from app.api.plans import router as plans_router, seed_sample_plans_if_empty
from app.api.performance import (
    router as performance_router,
    versions_router,
    retrain_router
)
from app.api.demo import router as demo_router
from app.ml.inference import ml_service

def init_db_and_seeds():
    print("Initializing Database tables...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Seed users
        demo_user = db.query(User).filter(User.email == "demo@healthcare.ai").first()
        if not demo_user:
            demo_user = User(
                email="demo@healthcare.ai",
                hashed_password=get_password_hash("Demo@1234"),
                full_name="Sarah Jenkins (Demo Patient)",
                role="user"
            )
            db.add(demo_user)

        admin_user = db.query(User).filter(User.email == "admin@healthcare.ai").first()
        if not admin_user:
            admin_user = User(
                email="admin@healthcare.ai",
                hashed_password=get_password_hash("Admin@1234"),
                full_name="System Administrator",
                role="admin"
            )
            db.add(admin_user)

        db.commit()

        # Seed plans
        seed_sample_plans_if_empty(db)
    finally:
        db.close()

    # Load ML models
    ml_service.load_models()

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db_and_seeds()
    yield

# Also run init_db_and_seeds immediately on module import so tables exist even if TestClient is used without context manager
init_db_and_seeds()

app = FastAPI(
    title=settings.APP_NAME,
    description="Industry-grade Decision Support Platform combining Health Risk Prediction, Medical Cost Estimation, and Insurance Plan Matching with SHAP Explainability. (Decision-support only — not a medical diagnosis or replacement for a doctor or insurance advisor).",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth_router)
app.include_router(assessment_router)
app.include_router(assessments_list_router)
app.include_router(predictions_router)
app.include_router(recommendations_router)
app.include_router(plans_router)
app.include_router(performance_router)
app.include_router(versions_router)
app.include_router(retrain_router)
app.include_router(demo_router)

@app.get("/")
def root():
    return {
        "status": "online",
        "service": settings.APP_NAME,
        "version": "1.0.0",
        "disclaimer": "Decision-support only — not a medical diagnosis or replacement for a doctor or insurance advisor.",
        "docs_url": "/docs",
        "health_check": "ok"
    }

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal Server Error",
            "message": str(exc) if settings.DEBUG else "An unexpected error occurred. Please try again later.",
            "disclaimer": "Decision-support only — not a medical diagnosis."
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
