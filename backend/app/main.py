from contextlib import asynccontextmanager
from datetime import datetime, timezone
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

try:
    from app.config import settings
    from app.database.database import init_db
    from app.services.prediction_service import prediction_service
    from app.routes import recognition, gestures, history, statistics
    from app.models.schemas import HealthResponse
except ModuleNotFoundError:  # pragma: no cover - fallback for root-level imports
    from backend.app.config import settings
    from backend.app.database.database import init_db
    from backend.app.services.prediction_service import prediction_service
    from backend.app.routes import recognition, gestures, history, statistics
    from backend.app.models.schemas import HealthResponse


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database tables and pre-load ML model
    print(f"[{settings.PROJECT_NAME}] Initializing database tables...")
    init_db()
    print(f"[{settings.PROJECT_NAME}] Loading ML models...")
    model_loaded = prediction_service.load_model()
    if model_loaded:
        print(f"[{settings.PROJECT_NAME}] ML Model loaded successfully.")
    else:
        print(f"[{settings.PROJECT_NAME}] ML Model not loaded yet. Will load once trained.")
    yield
    # Shutdown
    print(f"[{settings.PROJECT_NAME}] Shutting down.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Full-stack AI Hand Gesture Recognition Backend with OpenCV, MediaPipe, Scikit-learn, and SQLite",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(recognition.router)
app.include_router(gestures.router)
app.include_router(history.router)
app.include_router(statistics.router)


@app.get("/api/health", response_model=HealthResponse, tags=["Health"])
def health_check():
    """
    Health check endpoint returning system status and model readiness.
    """
    return HealthResponse(
        status="success",
        message="Backend is running",
        model_loaded=prediction_service.is_loaded,
        version="1.0.0",
        timestamp=datetime.now(timezone.utc).isoformat()
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
