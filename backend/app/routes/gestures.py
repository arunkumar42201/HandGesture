from fastapi import APIRouter
from typing import List

try:
    from app.config import GESTURE_METADATA
    from app.models.schemas import GestureInfo
except ModuleNotFoundError:  # pragma: no cover - fallback for root-level imports
    from backend.app.config import GESTURE_METADATA
    from backend.app.models.schemas import GestureInfo

router = APIRouter(tags=["Gestures"])


@router.get("/api/gestures", response_model=List[GestureInfo])
def get_supported_gestures():
    """
    Returns the full list of supported hand gestures, including
    emojis, descriptions, posture tips, and typical confidence metrics.
    """
    return GESTURE_METADATA
