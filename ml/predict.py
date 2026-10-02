"""
Real-time webcam prediction tester using MediaPipe and the trained ML model.
"""
import os
import sys
import joblib
import cv2
import numpy as np
import mediapipe as mp

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from ml.preprocess import normalize_landmarks, extract_landmarks_from_mediapipe


def run_live_prediction(models_dir: str = "models", confidence_threshold: float = 0.60):
    model_path = os.path.join(models_dir, "gesture_model.pkl")
    encoder_path = os.path.join(models_dir, "label_encoder.pkl")

    if not os.path.exists(model_path) or not os.path.exists(encoder_path):
        print("Model or encoder not found. Train the model first.")
        return

    model = joblib.load(model_path)
    label_encoder = joblib.load(encoder_path)
    print("Loaded model and encoder successfully.")

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
        print("Error: Could not open camera.")
        return

    print("\nLive Prediction running. Press 'q' to quit.")

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        frame = cv2.flip(frame, 1)
        h, w, c = frame.shape
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = hands.process(rgb)

        gesture_text = "No Hand Detected"
        conf_text = ""
        color = (150, 150, 150)

        if results.multi_hand_landmarks:
            for hand_landmarks in results.multi_hand_landmarks:
                mp_draw.draw_landmarks(frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)
                raw_lms = extract_landmarks_from_mediapipe(hand_landmarks)
                norm_feat = normalize_landmarks(raw_lms).reshape(1, -1)

                probabilities = model.predict_proba(norm_feat)[0]
                best_idx = np.argmax(probabilities)
                confidence = float(probabilities[best_idx])
                gesture_name = label_encoder.inverse_transform([best_idx])[0]

                if confidence >= confidence_threshold:
                    gesture_text = f"{gesture_name}"
                    conf_text = f"Confidence: {confidence * 100:.1f}%"
                    color = (0, 255, 0)
                else:
                    gesture_text = "Uncertain"
                    conf_text = f"Top: {gesture_name} ({confidence * 100:.1f}%)"
                    color = (0, 165, 255)

        cv2.rectangle(frame, (10, 10), (450, 100), (0, 0, 0), -1)
        cv2.putText(frame, gesture_text, (20, 50), cv2.FONT_HERSHEY_SIMPLEX, 1.1, color, 2)
        if conf_text:
            cv2.putText(frame, conf_text, (20, 85), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (200, 200, 200), 2)

        cv2.imshow("Hand Gesture Recognition Tester", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()
    hands.close()


if __name__ == "__main__":
    run_live_prediction()
