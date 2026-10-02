"""
Evaluates trained gesture recognition model against test samples.
"""
import os
import sys
import joblib
import numpy as np
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from ml.train_model import load_dataset


def evaluate(dataset_dir: str = "dataset", models_dir: str = "models"):
    model_path = os.path.join(models_dir, "gesture_model.pkl")
    encoder_path = os.path.join(models_dir, "label_encoder.pkl")

    if not os.path.exists(model_path) or not os.path.exists(encoder_path):
        print(f"Error: Model files not found in '{models_dir}'. Run train_model.py first.")
        return

    print("Loading model and label encoder...")
    model = joblib.load(model_path)
    label_encoder = joblib.load(encoder_path)

    X, y = load_dataset(dataset_dir)
    y_encoded = label_encoder.transform(y)

    predictions = model.predict(X)
    acc = accuracy_score(y_encoded, predictions)

    print("\n" + "=" * 45)
    print(f"OVERALL ACCURACY: {acc * 100:.2f}%")
    print("=" * 45)
    print("\nDetailed Classification Report:")
    print(classification_report(y_encoded, predictions, target_names=label_encoder.classes_))

    print("Confusion Matrix:")
    print(confusion_matrix(y_encoded, predictions))


if __name__ == "__main__":
    evaluate()
