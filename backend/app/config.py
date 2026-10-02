import os
from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Hand Gesture Recognition"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # Server
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]

    # Database
    DATABASE_URL: str = "sqlite:///./gesture_recognition.db"

    # Paths (relative to backend directory or workspace root)
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    MODEL_PATH: str = os.path.join(BASE_DIR, "models", "gesture_model.pkl")
    LABEL_ENCODER_PATH: str = os.path.join(BASE_DIR, "models", "label_encoder.pkl")

    # Recognition confidence threshold
    CONFIDENCE_THRESHOLD: float = 0.60

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()

# Supported gestures metadata registry
GESTURE_METADATA = [
    {
        "name": "Hello",
        "label": "Hello",
        "emoji": "👋",
        "description": "Greeting wave with an open palm slightly tilted and fingers relaxed.",
        "posture": "All 5 fingers extended and spread naturally with slight side-to-side orientation.",
        "typical_confidence": 0.96
    },
    {
        "name": "Thumbs Up",
        "label": "Thumbs Up",
        "emoji": "👍",
        "description": "Sign of approval or agreement. Thumb pointed straight up, fingers curled.",
        "posture": "Thumb extended upward at 90-degree angle; index, middle, ring, and pinky curled into fist.",
        "typical_confidence": 0.98
    },
    {
        "name": "Thumbs Down",
        "label": "Thumbs Down",
        "emoji": "👎",
        "description": "Sign of disapproval or dislike. Thumb pointed downward, fingers curled.",
        "posture": "Thumb extended directly downward toward bottom edge, remaining 4 fingers clenched.",
        "typical_confidence": 0.97
    },
    {
        "name": "Victory",
        "label": "Victory",
        "emoji": "✌️",
        "description": "Peace or Victory sign. Index and middle fingers extended apart in a V.",
        "posture": "Index and middle extended in clear V shape; thumb holding down ring and pinky fingers.",
        "typical_confidence": 0.97
    },
    {
        "name": "Fist",
        "label": "Fist",
        "emoji": "✊",
        "description": "Solid clenched fist. Represents strength, solid agreement, or rock.",
        "posture": "All five fingers folded tightly against the palm with thumb tucked across outer fingers.",
        "typical_confidence": 0.99
    },
    {
        "name": "Open Palm",
        "label": "Open Palm",
        "emoji": "✋",
        "description": "Stop or open hand. All five fingers fully extended and spread outwards.",
        "posture": "Fingers and thumb spread wide open facing directly forward toward the camera.",
        "typical_confidence": 0.99
    },
    {
        "name": "Pointing",
        "label": "Pointing",
        "emoji": "☝️",
        "description": "Attention gesture. Index finger pointing straight up, other fingers curled.",
        "posture": "Index finger extended vertically; thumb, middle, ring, and pinky fingers folded.",
        "typical_confidence": 0.96
    },
    {
        "name": "Two Fingers",
        "label": "Two Fingers",
        "emoji": "🤞",
        "description": "Two fingers extended upright and held close together.",
        "posture": "Index and middle fingers extended vertically parallel; thumb holding down other fingers.",
        "typical_confidence": 0.95
    },
    {
        "name": "OK",
        "label": "OK",
        "emoji": "👌",
        "description": "Agreement or perfection. Thumb tip touches index tip forming a circular loop.",
        "posture": "Thumb tip and index fingertip meet to create a loop; middle, ring, and pinky upright.",
        "typical_confidence": 0.98
    },
    {
        "name": "Love",
        "label": "Love",
        "emoji": "🤟",
        "description": "I Love You / Rock gesture. Thumb, index, and pinky extended; middle and ring folded.",
        "posture": "Index finger and pinky extended upward, thumb extended outward, middle and ring curled.",
        "typical_confidence": 0.97
    }
]
