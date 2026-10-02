import os
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, desc, asc, func
from sqlalchemy.orm import declarative_base, sessionmaker, Session

try:
    from app.config import settings
except ModuleNotFoundError:  # pragma: no cover - fallback for root-level imports
    from backend.app.config import settings

Base = declarative_base()

class PredictionRecord(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    gesture = Column(String(50), nullable=False, index=True)
    confidence = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    session_id = Column(String(100), nullable=True, index=True)
    hand_detected = Column(Boolean, default=True)


class SessionRecord(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    session_id = Column(String(100), unique=True, index=True, nullable=False)
    started_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    last_active = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    total_predictions = Column(Integer, default=0)


# Database Engine and Session Factory
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def save_prediction_record(
    db: Session,
    gesture: str,
    confidence: float,
    session_id: Optional[str] = None,
    hand_detected: bool = True
) -> PredictionRecord:
    record = PredictionRecord(
        gesture=gesture,
        confidence=float(confidence),
        session_id=session_id or "default_session",
        hand_detected=hand_detected,
        timestamp=datetime.now(timezone.utc)
    )
    db.add(record)

    # Update or create session
    sid = session_id or "default_session"
    sess = db.query(SessionRecord).filter(SessionRecord.session_id == sid).first()
    if sess:
        sess.last_active = datetime.now(timezone.utc)
        sess.total_predictions += 1
    else:
        sess = SessionRecord(
            session_id=sid,
            started_at=datetime.now(timezone.utc),
            last_active=datetime.now(timezone.utc),
            total_predictions=1
        )
        db.add(sess)

    db.commit()
    db.refresh(record)
    return record


def get_history_records(
    db: Session,
    limit: int = 50,
    offset: int = 0,
    gesture: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: str = "timestamp",
    sort_order: str = "desc"
) -> Dict[str, Any]:
    query = db.query(PredictionRecord)

    if gesture and gesture != "All":
        query = query.filter(PredictionRecord.gesture.ilike(f"%{gesture}%"))

    if search:
        query = query.filter(
            (PredictionRecord.gesture.ilike(f"%{search}%")) |
            (PredictionRecord.session_id.ilike(f"%{search}%"))
        )

    total_count = query.count()

    order_col = PredictionRecord.timestamp
    if sort_by == "confidence":
        order_col = PredictionRecord.confidence
    elif sort_by == "gesture":
        order_col = PredictionRecord.gesture

    if sort_order.lower() == "asc":
        query = query.order_by(asc(order_col))
    else:
        query = query.order_by(desc(order_col))

    items = query.offset(offset).limit(limit).all()
    return {
        "total": total_count,
        "limit": limit,
        "offset": offset,
        "items": items
    }


def delete_prediction_by_id(db: Session, record_id: int) -> bool:
    record = db.query(PredictionRecord).filter(PredictionRecord.id == record_id).first()
    if not record:
        return False
    db.delete(record)
    db.commit()
    return True


def clear_all_predictions(db: Session) -> int:
    deleted = db.query(PredictionRecord).delete()
    db.commit()
    return deleted


def get_system_statistics(db: Session) -> Dict[str, Any]:
    total_predictions = db.query(PredictionRecord).count()
    total_sessions = db.query(SessionRecord).count()

    if total_predictions == 0:
        return {
            "total_predictions": 0,
            "most_recognized_gesture": "N/A",
            "most_recognized_count": 0,
            "average_confidence": 0.0,
            "recognition_accuracy": 0.0,
            "total_sessions": total_sessions,
            "gesture_distribution": [],
            "recent_predictions": []
        }

    # Average confidence
    avg_conf = db.query(func.avg(PredictionRecord.confidence)).scalar() or 0.0

    # Most recognized gesture and distribution
    distribution = (
        db.query(PredictionRecord.gesture, func.count(PredictionRecord.id).label("count"))
        .group_by(PredictionRecord.gesture)
        .order_by(desc("count"))
        .all()
    )

    dist_list = [{"gesture": row[0], "count": row[1]} for row in distribution]
    most_recognized = dist_list[0]["gesture"] if dist_list else "N/A"
    most_count = dist_list[0]["count"] if dist_list else 0

    # Recent predictions
    recent = (
        db.query(PredictionRecord)
        .order_by(desc(PredictionRecord.timestamp))
        .limit(10)
        .all()
    )

    return {
        "total_predictions": total_predictions,
        "most_recognized_gesture": most_recognized,
        "most_recognized_count": most_count,
        "average_confidence": round(float(avg_conf) * 100, 1),
        "recognition_accuracy": round(float(avg_conf) * 100, 1),
        "total_sessions": max(1, total_sessions),
        "gesture_distribution": dist_list,
        "recent_predictions": [
            {
                "id": r.id,
                "gesture": r.gesture,
                "confidence": round(r.confidence * 100, 1),
                "timestamp": r.timestamp.isoformat() if r.timestamp else "",
                "session_id": r.session_id
            }
            for r in recent
        ]
    }
