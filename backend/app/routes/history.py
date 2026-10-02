from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

try:
    from app.database.database import (
        get_db,
        get_history_records,
        save_prediction_record,
        delete_prediction_by_id,
        clear_all_predictions
    )
    from app.models.schemas import HistoryResponse, SavePredictionRequest
except ModuleNotFoundError:  # pragma: no cover - fallback for root-level imports
    from backend.app.database.database import (
        get_db,
        get_history_records,
        save_prediction_record,
        delete_prediction_by_id,
        clear_all_predictions
    )
    from backend.app.models.schemas import HistoryResponse, SavePredictionRequest

router = APIRouter(tags=["History"])


@router.get("/api/history", response_model=HistoryResponse)
def get_prediction_history(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    gesture: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    sort_by: str = Query("timestamp", pattern="^(timestamp|confidence|gesture)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db)
):
    """
    Retrieves paginated prediction history with optional gesture filtering,
    search query, and multi-field sorting.
    """
    res = get_history_records(
        db=db,
        limit=limit,
        offset=offset,
        gesture=gesture,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order
    )
    return res


@router.post("/api/history")
def save_prediction(
    payload: SavePredictionRequest,
    db: Session = Depends(get_db)
):
    """
    Manually records a prediction entry into the database.
    """
    record = save_prediction_record(
        db=db,
        gesture=payload.gesture,
        confidence=payload.confidence,
        session_id=payload.session_id,
        hand_detected=payload.hand_detected
    )
    return {"status": "success", "message": "Prediction saved", "id": record.id}


@router.delete("/api/history/{record_id}")
def delete_history_item(
    record_id: int,
    db: Session = Depends(get_db)
):
    """
    Deletes a specific prediction record by ID.
    """
    deleted = delete_prediction_by_id(db, record_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Prediction record not found.")
    return {"status": "success", "message": f"Record {record_id} deleted."}


@router.delete("/api/history")
def clear_history(db: Session = Depends(get_db)):
    """
    Clears all saved prediction records.
    """
    count = clear_all_predictions(db)
    return {"status": "success", "message": f"Cleared {count} history records."}
