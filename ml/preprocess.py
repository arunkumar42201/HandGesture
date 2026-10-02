"""
Landmark preprocessing and feature normalization utilities.
Provides translation and scale invariance for 21 3D hand landmarks.
"""
from typing import List, Union, Tuple, Optional
import numpy as np


NUM_LANDMARKS = 21
COORDINATES_PER_LANDMARK = 3
TOTAL_FEATURES = NUM_LANDMARKS * COORDINATES_PER_LANDMARK  # 63


def normalize_landmarks(landmarks: Union[np.ndarray, List[float]]) -> np.ndarray:
    """
    Normalizes hand landmarks to achieve translation and scale invariance:
    1. Reshapes to (21, 3).
    2. Translates all landmarks relative to the wrist (landmark 0 at index 0).
    3. Computes the maximum distance from wrist to any landmark (scale factor).
    4. Scales coordinates by this factor.
    5. Flattens back to 63-dimensional feature vector.
    """
    arr = np.array(landmarks, dtype=np.float32)
    if arr.ndim == 1:
        if len(arr) != TOTAL_FEATURES:
            raise ValueError(f"Expected {TOTAL_FEATURES} features, got {len(arr)}")
        arr = arr.reshape(NUM_LANDMARKS, COORDINATES_PER_LANDMARK)
    elif arr.shape != (NUM_LANDMARKS, COORDINATES_PER_LANDMARK):
        raise ValueError(f"Expected shape ({NUM_LANDMARKS}, {COORDINATES_PER_LANDMARK}), got {arr.shape}")

    # Step 1: Translation invariance - shift wrist to (0, 0, 0)
    wrist = arr[0].copy()
    translated = arr - wrist

    # Step 2: Scale invariance - scale by max distance from wrist
    distances = np.linalg.norm(translated, axis=1)
    max_dist = np.max(distances)
    if max_dist < 1e-6:
        max_dist = 1.0  # Prevent division by zero

    normalized = translated / max_dist
    return normalized.flatten()


def extract_landmarks_from_mediapipe(hand_landmarks) -> List[float]:
    """
    Converts MediaPipe Hand landmark object into a flat list of 63 floats [x, y, z, ...].
    """
    flat = []
    for lm in hand_landmarks.landmark:
        flat.extend([lm.x, lm.y, lm.z])
    return flat


def calculate_bounding_box(landmarks: Union[np.ndarray, List[float]], img_w: int, img_h: int) -> Tuple[int, int, int, int]:
    """
    Calculates (min_x, min_y, max_x, max_y) pixel bounding box from normalized landmarks.
    """
    arr = np.array(landmarks, dtype=np.float32).reshape(NUM_LANDMARKS, COORDINATES_PER_LANDMARK)
    xs = arr[:, 0] * img_w
    ys = arr[:, 1] * img_h
    min_x, max_x = int(np.min(xs)), int(np.max(xs))
    min_y, max_y = int(np.min(ys)), int(np.max(ys))
    
    # Add 10% padding
    pad_x = int((max_x - min_x) * 0.1)
    pad_y = int((max_y - min_y) * 0.1)
    
    return (
        max(0, min_x - pad_x),
        max(0, min_y - pad_y),
        min(img_w, max_x + pad_x),
        min(img_h, max_y + pad_y)
    )
