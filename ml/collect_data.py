"""
Collects real-time hand landmark training data using OpenCV and MediaPipe.
Press 's' to start recording samples for a chosen gesture.
Press 'q' to exit.
"""
import os
import sys
import csv
import time
import cv2
import mediapipe as mp

# Add parent directory to path so we can import preprocess
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from ml.preprocess import extract_landmarks_from_mediapipe

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

def select_gesture() -> str:
    print("\n--- Hand Gesture Data Collection ---")
    for idx, g in enumerate(GESTURES, 1):
        print(f"[{idx}] {g}")
    print("[0] Custom gesture name")
    
    while True:
        try:
            choice = input("\nSelect gesture number: ").strip()
            if choice == "0":
                custom = input("Enter custom gesture name: ").strip()
                if custom:
                    return custom
            val = int(choice)
            if 1 <= val <= len(GESTURES):
                return GESTURES[val - 1]
        except ValueError:
            pass
        print("Invalid choice, please try again.")


def collect_data(gesture_name: str, target_samples: int = 150, output_dir: str = "dataset"):
    folder_name = gesture_name.lower().replace(" ", "_")
    save_dir = os.path.join(output_dir, folder_name)
    os.makedirs(save_dir, exist_ok=True)
    csv_file = os.path.join(save_dir, "landmarks.csv")

    header = [f"lm_{i}_{axis}" for i in range(21) for axis in ("x", "y", "z")]
    header.append("label")

    file_exists = os.path.isfile(csv_file)
    f = open(csv_file, mode="a", newline="", encoding="utf-8")
    writer = csv.writer(f)
    if not file_exists:
        writer.writerow(header)

    mp_hands = mp.solutions.hands
    mp_draw = mp.solutions.drawing_utils
    hands = mp_hands.Hands(
        static_image_mode=False,
        max_num_hands=1,
        min_detection_confidence=0.7,
        min_tracking_confidence=0.5
    )

    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("Error: Could not open webcam.")
        f.close()
        return

    print(f"\nTarget Gesture: '{gesture_name}'")
    print(f"Saving to: {csv_file}")
    print("Instructions:")
    print(" - Press 's' to start/pause recording frames")
    print(" - Press 'q' to finish and exit")

    recording = False
    samples_collected = 0

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        # Flip horizontally for natural mirror display
        frame = cv2.flip(frame, 1)
        h, w, c = frame.shape
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = hands.process(rgb)

        hand_detected = False
        if results.multi_hand_landmarks:
            hand_detected = True
            for hand_landmarks in results.multi_hand_landmarks:
                mp_draw.draw_landmarks(frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)
                
                if recording and samples_collected < target_samples:
                    raw_lms = extract_landmarks_from_mediapipe(hand_landmarks)
                    row = raw_lms + [gesture_name]
                    writer.writerow(row)
                    f.flush()
                    samples_collected += 1

        # UI Overlay on camera view
        status_text = f"RECORDING ({samples_collected}/{target_samples})" if recording else "PAUSED (Press 's' to record)"
        color = (0, 255, 0) if recording else (0, 165, 255)
        
        cv2.putText(frame, f"Gesture: {gesture_name}", (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (255, 255, 255), 2)
        cv2.putText(frame, status_text, (20, 80), cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)
        cv2.putText(frame, "Hand: " + ("Detected" if hand_detected else "None"), (20, 120), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0) if hand_detected else (0, 0, 255), 2)
        cv2.putText(frame, "Press 's': toggle record | 'q': quit", (20, h - 20), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 200, 200), 1)

        cv2.imshow("Hand Gesture Data Collector", frame)
        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'):
            break
        elif key == ord('s'):
            recording = not recording

        if samples_collected >= target_samples:
            print(f"Goal reached! Collected {samples_collected} samples.")
            break

    cap.release()
    cv2.destroyAllWindows()
    hands.close()
    f.close()
    print(f"Finished. Total samples saved: {samples_collected}")


if __name__ == "__main__":
    gesture = select_gesture()
    count_str = input("Target samples count (default 150): ").strip()
    count = int(count_str) if count_str.isdigit() else 150
    collect_data(gesture, count)
