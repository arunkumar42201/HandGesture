from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

try:
    from app.database.database import get_db, get_system_statistics
    from app.models.schemas import StatisticsResponse
except ModuleNotFoundError:  # pragma: no cover - fallback for root-level imports
    from backend.app.database.database import get_db, get_system_statistics
    from backend.app.models.schemas import StatisticsResponse

router = APIRouter(tags=["Statistics"])


@router.get("/api/statistics", response_model=StatisticsResponse)
def get_statistics_endpoint(db: Session = Depends(get_db)):
    """
    Returns analytics metrics including total predictions, most frequent gesture,
    average confidence, gesture distribution, and recent predictions.
    """
    stats = get_system_statistics(db)
    return stats
