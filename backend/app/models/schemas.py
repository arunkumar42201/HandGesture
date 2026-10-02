from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


class LandmarkPoint(BaseModel):
    x: float
    y: float
    z: float


class RecognitionRequest(BaseModel):
    image: Optional[str] = Field(None, description="Base64 encoded JPEG/PNG frame")
    session_id: Optional[str] = Field("default_session", description="Unique session identifier")
    save_history: Optional[bool] = Field(True, description="Whether to store prediction in database")


class GestureProbability(BaseModel):
    gesture: str
    probability: float


class RecognitionResponse(BaseModel):
    gesture: str
    confidence: float
    hand_detected: bool
    num_hands: int = 0
    probabilities: Optional[List[GestureProbability]] = []
    landmarks: Optional[List[LandmarkPoint]] = None
    bounding_box: Optional[Dict[str, int]] = None
    fps: Optional[float] = 0.0
    status: str = "success"
    message: Optional[str] = None


class GestureInfo(BaseModel):
    name: str
    label: str
    emoji: str
    description: str
    posture: str
    typical_confidence: float


class HistoryItem(BaseModel):
    id: int
    gesture: str
    confidence: float
    timestamp: datetime
    session_id: Optional[str] = None
    hand_detected: bool = True

    class Config:
        from_attributes = True


class HistoryResponse(BaseModel):
    total: int
    limit: int
    offset: int
    items: List[HistoryItem]


class SavePredictionRequest(BaseModel):
    gesture: str
    confidence: float
    session_id: Optional[str] = "default_session"
    hand_detected: Optional[bool] = True


class HealthResponse(BaseModel):
    status: str = "success"
    message: str = "Backend is running"
    model_loaded: bool
    version: str = "1.0.0"
    timestamp: str


class GestureCount(BaseModel):
    gesture: str
    count: int


class StatisticsResponse(BaseModel):
    total_predictions: int
    most_recognized_gesture: str
    most_recognized_count: int
    average_confidence: float
    recognition_accuracy: float
    total_sessions: int
    gesture_distribution: List[GestureCount]
    recent_predictions: List[Dict[str, Any]]
