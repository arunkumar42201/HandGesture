import cv2
import numpy as np
import mediapipe as mp
import os
import urllib.request
from typing import Tuple, List, Optional, Any

try:
    from app.config import settings
except ModuleNotFoundError:  # pragma: no cover - fallback for root-level imports
    from backend.app.config import settings


class LandmarkExtractor:
    def __init__(self, max_num_hands: int = 1, min_detection_confidence: float = 0.65, min_tracking_confidence: float = 0.5):
        self.mp_hands = getattr(getattr(mp, "solutions", None), "hands", None)
        if self.mp_hands is None:
            try:
                from mediapipe.python.solutions import hands as mp_hands_module
                self.mp_hands = mp_hands_module
            except Exception:
                self.mp_hands = None

        self.hands = None
        self.task_landmarker = None
        if self.mp_hands is None:
            try:
                from mediapipe.tasks import python
                from mediapipe.tasks.python import vision

                model_path = os.path.join(settings.BASE_DIR, "models", "hand_landmarker.task")
                os.makedirs(os.path.dirname(model_path), exist_ok=True)
                if not os.path.exists(model_path):
                    print("[LandmarkExtractor] Downloading MediaPipe hand landmark model...")
                    urllib.request.urlretrieve(
                        "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
                        model_path,
                    )

                self.task_landmarker = vision.HandLandmarker.create_from_options(
                    vision.HandLandmarkerOptions(
                        base_options=python.BaseOptions(model_asset_path=model_path),
                        running_mode=vision.RunningMode.IMAGE,
                        num_hands=max_num_hands,
                        min_hand_detection_confidence=min_detection_confidence,
                        min_hand_presence_confidence=min_detection_confidence,
                        min_tracking_confidence=min_tracking_confidence,
                    )
                )
                print("[LandmarkExtractor] Using MediaPipe Tasks hand landmarker.")
                return
            except Exception as e:
                print(f"[LandmarkExtractor] Could not initialize MediaPipe hand landmarker: {e}")
                return

        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=max_num_hands,
            min_detection_confidence=min_detection_confidence,
            min_tracking_confidence=min_tracking_confidence
        )

    def extract(self, image_bgr: np.ndarray) -> Tuple[bool, List[List[float]], List[dict]]:
        """
        Processes a BGR image and extracts hand landmarks.
        Returns:
            (hand_detected: bool,
             flat_landmarks: List of [63 floats per hand],
             structured_landmarks: List of [{'x': float, 'y': float, 'z': float}, ...])
        """
        if image_bgr is None or image_bgr.size == 0:
            return False, [], []
        if self.hands is None and self.task_landmarker is None:
            return False, [], []

        try:
            image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
            if self.task_landmarker is not None:
                mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=image_rgb)
                results = self.task_landmarker.detect(mp_image)
                detected_landmarks = results.hand_landmarks
            else:
                results = self.hands.process(image_rgb)
                detected_landmarks = results.multi_hand_landmarks or []

            if not detected_landmarks:
                return False, [], []

            all_flat = []
            primary_structured = []

            for i, hand_landmarks in enumerate(detected_landmarks):
                points = hand_landmarks if self.task_landmarker is not None else hand_landmarks.landmark
                flat = []
                for lm in points:
                    flat.extend([lm.x, lm.y, lm.z])
                    if i == 0:
                        primary_structured.append({"x": lm.x, "y": lm.y, "z": lm.z})
                all_flat.append(flat)

            return True, all_flat, primary_structured

        except Exception as e:
            print(f"Error in LandmarkExtractor: {e}")
            return False, [], []

    def close(self):
        try:
            if self.hands is not None:
                self.hands.close()
            if self.task_landmarker is not None:
                self.task_landmarker.close()
        except Exception:
            pass


# Global singleton instance
landmark_extractor = LandmarkExtractor()
