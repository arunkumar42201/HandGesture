"""
Generates a realistic synthetic 21-landmark dataset for 10 hand gestures:
- Hello
- Thumbs Up
- Thumbs Down
- Victory
- Fist
- Open Palm
- Pointing
- Two Fingers
- OK
- Love
Includes 3D rotation, scaling, jitter, and finger articulation variations.
"""
import os
import csv
import math
import numpy as np
from typing import Dict, List

# Target gestures list
GESTURES = [
    "Hello",
    "Thumbs Up",
    "Thumbs Down",
    "Victory",
    "Fist",
    "Open Palm",
    "Pointing",
    "Two Fingers",
    "OK",
    "Love"
]

def get_base_skeleton() -> Dict[int, List[float]]:
    """Base hand landmarks in normalized coordinates (21 joints)."""
    return {
        0: [0.50, 0.80, 0.00],  # WRIST
        # Thumb
        1: [0.44, 0.74, -0.01],
        2: [0.39, 0.67, -0.02],
        3: [0.35, 0.60, -0.03],
        4: [0.32, 0.54, -0.04],
        # Index
        5: [0.44, 0.58, -0.01],
        6: [0.43, 0.49, -0.02],
        7: [0.42, 0.42, -0.03],
        8: [0.41, 0.35, -0.04],
        # Middle
        9: [0.50, 0.56, -0.01],
        10: [0.50, 0.46, -0.02],
        11: [0.50, 0.38, -0.03],
        12: [0.50, 0.30, -0.04],
        # Ring
        13: [0.56, 0.58, -0.01],
        14: [0.57, 0.49, -0.02],
        15: [0.58, 0.42, -0.03],
        16: [0.59, 0.36, -0.04],
        # Pinky
        17: [0.61, 0.62, -0.01],
        18: [0.63, 0.55, -0.02],
        19: [0.65, 0.50, -0.03],
        20: [0.67, 0.44, -0.03]
    }


def create_gesture_template(gesture: str) -> np.ndarray:
    """Returns 21x3 coordinates for a specific canonical gesture."""
    lm = get_base_skeleton()

    def curl_finger(mcp_idx: int, dir_x: float = 0.0):
        mcp = lm[mcp_idx]
        # PIP goes slightly forward/up
        lm[mcp_idx + 1] = [mcp[0] + dir_x * 0.02, mcp[1] - 0.05, -0.04]
        # DIP curls down towards palm
        lm[mcp_idx + 2] = [mcp[0] + dir_x * 0.01, mcp[1] - 0.01, -0.06]
        # TIP touches palm near MCP
        lm[mcp_idx + 3] = [mcp[0], mcp[1] + 0.03, -0.05]

    def curl_thumb(inwards: bool = True):
        if inwards:
            lm[1] = [0.45, 0.73, -0.02]
            lm[2] = [0.43, 0.67, -0.04]
            lm[3] = [0.45, 0.63, -0.05]
            lm[4] = [0.48, 0.61, -0.05]  # Tucked against index MCP
        else:
            lm[1] = [0.44, 0.74, -0.01]
            lm[2] = [0.39, 0.67, -0.02]
            lm[3] = [0.35, 0.60, -0.03]
            lm[4] = [0.32, 0.54, -0.04]

    if gesture == "Open Palm":
        # All fingers extended and spread
        lm[8] = [0.38, 0.32, -0.04]   # Index spread out
        lm[12] = [0.50, 0.28, -0.04]  # Middle straight
        lm[16] = [0.62, 0.32, -0.04]  # Ring spread out
        lm[20] = [0.72, 0.40, -0.04]  # Pinky spread out
        lm[4] = [0.28, 0.52, -0.05]   # Thumb spread out

    elif gesture == "Hello":
        # Wave/hello - similar to open palm with slight tilt and curved thumb
        lm[8] = [0.39, 0.31, -0.03]
        lm[12] = [0.50, 0.27, -0.03]
        lm[16] = [0.61, 0.31, -0.03]
        lm[20] = [0.71, 0.38, -0.03]
        lm[4] = [0.30, 0.55, -0.04]

    elif gesture == "Fist":
        curl_thumb(inwards=True)
        curl_finger(5, -0.5)
        curl_finger(9, 0.0)
        curl_finger(13, 0.5)
        curl_finger(17, 1.0)

    elif gesture == "Thumbs Up":
        # Thumb points straight up
        lm[1] = [0.44, 0.73, -0.01]
        lm[2] = [0.42, 0.64, -0.03]
        lm[3] = [0.42, 0.52, -0.04]
        lm[4] = [0.42, 0.40, -0.05]  # Straight up!
        curl_finger(5, -0.5)
        curl_finger(9, 0.0)
        curl_finger(13, 0.5)
        curl_finger(17, 1.0)

    elif gesture == "Thumbs Down":
        # Hand oriented or thumb pointing down
        lm[1] = [0.45, 0.74, -0.01]
        lm[2] = [0.44, 0.81, -0.02]
        lm[3] = [0.44, 0.90, -0.03]
        lm[4] = [0.44, 1.00, -0.04]  # Points straight down!
        curl_finger(5, -0.5)
        curl_finger(9, 0.0)
        curl_finger(13, 0.5)
        curl_finger(17, 1.0)

    elif gesture == "Victory":
        curl_thumb(inwards=True)
        # Index and Middle extended in V shape
        lm[6] = [0.41, 0.48, -0.02]
        lm[7] = [0.38, 0.40, -0.03]
        lm[8] = [0.34, 0.32, -0.04]  # Tilted left

        lm[10] = [0.52, 0.48, -0.02]
        lm[11] = [0.55, 0.40, -0.03]
        lm[12] = [0.58, 0.32, -0.04]  # Tilted right

        curl_finger(13, 0.5)
        curl_finger(17, 1.0)

    elif gesture == "Pointing":
        curl_thumb(inwards=True)
        # Index straight up
        lm[6] = [0.44, 0.48, -0.02]
        lm[7] = [0.44, 0.39, -0.03]
        lm[8] = [0.44, 0.30, -0.04]  # Straight up

        curl_finger(9, 0.0)
        curl_finger(13, 0.5)
        curl_finger(17, 1.0)

    elif gesture == "Two Fingers":
        curl_thumb(inwards=True)
        # Index and middle straight and close together
        lm[6] = [0.45, 0.48, -0.02]
        lm[7] = [0.45, 0.39, -0.03]
        lm[8] = [0.45, 0.30, -0.04]

        lm[10] = [0.49, 0.48, -0.02]
        lm[11] = [0.49, 0.39, -0.03]
        lm[12] = [0.49, 0.30, -0.04]

        curl_finger(13, 0.5)
        curl_finger(17, 1.0)

    elif gesture == "OK":
        # Thumb tip and Index tip touching to form circle
        touch_point = [0.42, 0.52, -0.04]
        lm[3] = [0.39, 0.58, -0.03]
        lm[4] = touch_point.copy()

        lm[6] = [0.42, 0.52, -0.02]
        lm[7] = [0.41, 0.54, -0.03]
        lm[8] = [0.42, 0.53, -0.04]  # Meets thumb tip

        # Middle, Ring, Pinky extended
        lm[10] = [0.50, 0.46, -0.02]
        lm[11] = [0.50, 0.38, -0.03]
        lm[12] = [0.50, 0.30, -0.04]

        lm[14] = [0.57, 0.49, -0.02]
        lm[15] = [0.58, 0.42, -0.03]
        lm[16] = [0.59, 0.36, -0.04]

        lm[18] = [0.63, 0.55, -0.02]
        lm[19] = [0.65, 0.50, -0.03]
        lm[20] = [0.67, 0.44, -0.03]

    elif gesture == "Love":
        # Thumb extended, Index extended, Pinky extended, Middle & Ring curled
        lm[1] = [0.44, 0.74, -0.01]
        lm[2] = [0.38, 0.68, -0.02]
        lm[3] = [0.32, 0.62, -0.03]
        lm[4] = [0.26, 0.56, -0.04]  # Thumb out

        lm[6] = [0.44, 0.48, -0.02]
        lm[7] = [0.44, 0.39, -0.03]
        lm[8] = [0.44, 0.30, -0.04]  # Index straight up

        curl_finger(9, 0.0)   # Middle curled
        curl_finger(13, 0.5)  # Ring curled

        lm[18] = [0.64, 0.54, -0.02]
        lm[19] = [0.66, 0.47, -0.03]
        lm[20] = [0.68, 0.40, -0.04]  # Pinky extended up

    coords = np.array([lm[i] for i in range(21)], dtype=np.float32)
    return coords


def apply_random_transformations(coords: np.ndarray) -> np.ndarray:
    """Applies realistic 3D rotation, scaling, translation, and noise."""
    res = coords.copy()

    # Center around wrist for rotation
    wrist = res[0].copy()
    res -= wrist

    # Random 3D rotation (yaw, pitch, roll) in radians
    angle_z = np.random.uniform(-math.radians(25), math.radians(25))  # in-plane rotation
    angle_y = np.random.uniform(-math.radians(20), math.radians(20))  # yaw
    angle_x = np.random.uniform(-math.radians(20), math.radians(20))  # pitch

    # Rotation matrix Z
    Rz = np.array([
        [math.cos(angle_z), -math.sin(angle_z), 0],
        [math.sin(angle_z),  math.cos(angle_z), 0],
        [0, 0, 1]
    ])

    # Rotation matrix Y
    Ry = np.array([
        [math.cos(angle_y), 0, math.sin(angle_y)],
        [0, 1, 0],
        [-math.sin(angle_y), 0, math.cos(angle_y)]
    ])

    # Rotation matrix X
    Rx = np.array([
        [1, 0, 0],
        [0, math.cos(angle_x), -math.sin(angle_x)],
        [0, math.sin(angle_x),  math.cos(angle_x)]
    ])

    R = Rz @ Ry @ Rx
    res = res @ R.T

    # Random scale factor (0.75 to 1.25)
    scale = np.random.uniform(0.75, 1.25)
    res *= scale

    # Re-add wrist with random global translation
    res += wrist + np.random.uniform(-0.1, 0.1, size=(3,))

    # Add Gaussian jitter/sensor noise to each joint (except wrist slightly more stable)
    noise = np.random.normal(0, 0.006, size=res.shape)
    noise[0] *= 0.5  # Wrist has lower noise
    res += noise

    return res


def generate_dataset(samples_per_gesture: int = 500, output_dir: str = "dataset"):
    """Generates synthetic dataset and saves CSV files per gesture class."""
    os.makedirs(output_dir, exist_ok=True)
    total_samples = 0

    header = [f"lm_{i}_{axis}" for i in range(21) for axis in ("x", "y", "z")]
    header.append("label")

    master_rows = []

    for gesture in GESTURES:
        g_dir = os.path.join(output_dir, gesture.lower().replace(" ", "_"))
        os.makedirs(g_dir, exist_ok=True)
        csv_file = os.path.join(g_dir, "landmarks.csv")

        template = create_gesture_template(gesture)
        rows = []

        for _ in range(samples_per_gesture):
            sample = apply_random_transformations(template)
            row = sample.flatten().tolist()
            row.append(gesture)
            rows.append(row)
            master_rows.append(row)

        with open(csv_file, mode="w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(header)
            writer.writerows(rows)

        print(f"Generated {len(rows)} samples for gesture '{gesture}' -> {csv_file}")
        total_samples += len(rows)

    # Save unified master dataset
    master_path = os.path.join(output_dir, "master_dataset.csv")
    with open(master_path, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(header)
        writer.writerows(master_rows)

    print(f"\nSuccessfully generated {total_samples} total samples across {len(GESTURES)} gestures!")
    print(f"Master dataset saved at: {master_path}")


if __name__ == "__main__":
    generate_dataset()
