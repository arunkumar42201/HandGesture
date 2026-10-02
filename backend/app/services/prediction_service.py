import os
import time
import base64
import joblib
import cv2
import numpy as np
from typing import Optional, Dict, Any, Tuple

try:
    from app.config import settings
    from app.services.landmark_extractor import landmark_extractor
    from app.services.feature_normalizer import normalize_landmarks
except ModuleNotFoundError:  # pragma: no cover - fallback for root-level imports
    from backend.app.config import settings
    from backend.app.services.landmark_extractor import landmark_extractor
    from backend.app.services.feature_normalizer import normalize_landmarks


class PredictionService:
    def __init__(self):
        self.model = None
        self.label_encoder = None
        self.is_loaded = False
        self.last_frame_time = time.time()
        self.fps = 0.0
        self.load_model()

    def load_model(self) -> bool:
        """Loads trained model and label encoder from disk."""
        model_path = settings.MODEL_PATH
        encoder_path = settings.LABEL_ENCODER_PATH

        if os.path.exists(model_path) and os.path.exists(encoder_path):
            try:
                self.model = joblib.load(model_path)
                self.label_encoder = joblib.load(encoder_path)
                self.is_loaded = True
                print(f"[PredictionService] Loaded model from {model_path}")
                print(f"[PredictionService] Classes: {list(self.label_encoder.classes_)}")
                return True
            except Exception as e:
                print(f"[PredictionService] Error loading model: {e}")
                self.is_loaded = False
                return False
        else:
            print(f"[PredictionService] Model files not found at {model_path}")
            self.is_loaded = False
            return False

    def decode_base64_image(self, base64_str: str) -> Optional[np.ndarray]:
        """Decodes base64 string (with or without data URI header) into BGR OpenCV image."""
        try:
            if "," in base64_str:
                base64_str = base64_str.split(",", 1)[1]
            image_data = base64.b64decode(base64_str)
            nparr = np.frombuffer(image_data, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            return img
        except Exception as e:
            print(f"[PredictionService] Failed to decode image: {e}")
            return None

    def predict_from_image(self, image_bgr: np.ndarray) -> Dict[str, Any]:
        """
        Runs full pipeline:
        OpenCV Image -> MediaPipe Hand Landmarks -> Normalization -> ML Model -> Prediction + Confidence
        """
        start_time = time.time()
        
        # Calculate instantaneous FPS
        elapsed = start_time - self.last_frame_time
        if elapsed > 0:
            current_fps = 1.0 / elapsed
            # Smooth FPS using exponential moving average
            self.fps = round(0.8 * self.fps + 0.2 * current_fps, 1) if self.fps > 0 else round(current_fps, 1)
        self.last_frame_time = start_time

        if image_bgr is None or image_bgr.size == 0:
            return {
                "gesture": "No Image",
                "confidence": 0.0,
                "hand_detected": False,
                "num_hands": 0,
                "probabilities": [],
                "landmarks": None,
                "bounding_box": None,
                "fps": self.fps,
                "status": "error",
                "message": "Empty or invalid frame received"
            }

        # Step 1: Detect hands & extract landmarks
        h, w = image_bgr.shape[:2]
        hand_detected, all_flat_lms, structured_lms = landmark_extractor.extract(image_bgr)

        if not hand_detected or not all_flat_lms:
            return {
                "gesture": "No Hand Detected",
                "confidence": 0.0,
                "hand_detected": False,
                "num_hands": 0,
                "probabilities": [],
                "landmarks": None,
                "bounding_box": None,
                "fps": self.fps,
                "status": "success",
                "message": "No hand found in frame"
            }

        # Step 2: Extract primary hand landmarks (first hand)
        primary_raw = all_flat_lms[0]

        # Calculate bounding box
        coords_2d = np.array(primary_raw).reshape(21, 3)[:, :2]
        pixel_x = coords_2d[:, 0] * w
        pixel_y = coords_2d[:, 1] * h
        bbox = {
            "x_min": max(0, int(np.min(pixel_x) - 15)),
            "y_min": max(0, int(np.min(pixel_y) - 15)),
            "x_max": min(w, int(np.max(pixel_x) + 15)),
            "y_max": min(h, int(np.max(pixel_y) + 15))
        }

        # Step 3: Feature normalization
        try:
            norm_features = normalize_landmarks(primary_raw).reshape(1, -1)
        except Exception as e:
            return {
                "gesture": "Processing Error",
                "confidence": 0.0,
                "hand_detected": True,
                "num_hands": len(all_flat_lms),
                "probabilities": [],
                "landmarks": structured_lms,
                "bounding_box": bbox,
                "fps": self.fps,
                "status": "error",
                "message": f"Feature normalization failed: {str(e)}"
            }

        # Step 4: Model inference
        if not self.is_loaded:
            self.load_model()

        if not self.is_loaded or self.model is None:
            return {
                "gesture": "Model Unavailable",
                "confidence": 0.0,
                "hand_detected": True,
                "num_hands": len(all_flat_lms),
                "probabilities": [],
                "landmarks": structured_lms,
                "bounding_box": bbox,
                "fps": self.fps,
                "status": "error",
                "message": "ML model not loaded"
            }

        try:
            probabilities = self.model.predict_proba(norm_features)[0]
            classes = self.label_encoder.classes_

            prob_list = [
                {"gesture": str(cls_name), "probability": round(float(prob), 4)}
                for cls_name, prob in zip(classes, probabilities)
            ]
            prob_list.sort(key=lambda x: x["probability"], reverse=True)

            top_prediction = prob_list[0]
            best_gesture = top_prediction["gesture"]
            best_confidence = top_prediction["probability"]

            # Filter against threshold
            if best_confidence < settings.CONFIDENCE_THRESHOLD:
                display_gesture = "Uncertain"
            else:
                display_gesture = best_gesture

            return {
                "gesture": display_gesture,
                "raw_gesture": best_gesture,
                "confidence": round(best_confidence, 4),
                "hand_detected": True,
                "num_hands": len(all_flat_lms),
                "probabilities": prob_list[:5],  # top 5
                "landmarks": structured_lms,
                "bounding_box": bbox,
                "fps": self.fps,
                "status": "success",
                "message": None
            }

        except Exception as e:
            return {
                "gesture": "Prediction Error",
                "confidence": 0.0,
                "hand_detected": True,
                "num_hands": len(all_flat_lms),
                "probabilities": [],
                "landmarks": structured_lms,
                "bounding_box": bbox,
                "fps": self.fps,
                "status": "error",
                "message": f"Inference failed: {str(e)}"
            }


# Singleton service
prediction_service = PredictionService()
