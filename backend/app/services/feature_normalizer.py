from typing import List, Union
import numpy as np

NUM_LANDMARKS = 21
COORDINATES_PER_LANDMARK = 3
TOTAL_FEATURES = 63


def normalize_landmarks(landmarks: Union[np.ndarray, List[float]]) -> np.ndarray:
    """
    Normalizes hand landmarks to achieve translation and scale invariance.
    - Centers wrist at (0, 0, 0)
    - Scales by maximum Euclidean distance from wrist to any joint
    """
    arr = np.array(landmarks, dtype=np.float32)
    if arr.ndim == 1:
        if len(arr) != TOTAL_FEATURES:
            raise ValueError(f"Expected {TOTAL_FEATURES} features, got {len(arr)}")
        arr = arr.reshape(NUM_LANDMARKS, COORDINATES_PER_LANDMARK)
    elif arr.shape != (NUM_LANDMARKS, COORDINATES_PER_LANDMARK):
        raise ValueError(f"Expected shape ({NUM_LANDMARKS}, {COORDINATES_PER_LANDMARK}), got {arr.shape}")

    # Shift wrist to origin
    wrist = arr[0].copy()
    translated = arr - wrist

    # Scale by maximum distance
    distances = np.linalg.norm(translated, axis=1)
    max_dist = np.max(distances)
    if max_dist < 1e-6:
        max_dist = 1.0

    normalized = translated / max_dist
    return normalized.flatten()
