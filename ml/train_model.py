"""
Trains a Scikit-Learn Random Forest Classifier on normalized hand landmark features.
Saves the trained model and label encoder to the `models/` directory.
"""
import os
import sys
import glob
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from ml.preprocess import normalize_landmarks, TOTAL_FEATURES


def load_dataset(dataset_dir: str = "dataset"):
    """Loads all CSV files in the dataset directory and normalizes landmarks."""
    csv_files = glob.glob(os.path.join(dataset_dir, "**", "*.csv"), recursive=True)
    # Exclude master_dataset if individual folders exist to avoid duplication
    individual_files = [f for f in csv_files if "master_dataset.csv" not in os.path.basename(f)]
    files_to_load = individual_files if individual_files else csv_files

    if not files_to_load:
        raise FileNotFoundError(f"No CSV dataset files found in '{dataset_dir}'.")

    print(f"Loading data from {len(files_to_load)} CSV file(s)...")

    all_features = []
    all_labels = []

    for file_path in files_to_load:
        df = pd.read_csv(file_path)
        if "label" not in df.columns:
            continue
        
        feature_cols = [c for c in df.columns if c != "label"]
        if len(feature_cols) != TOTAL_FEATURES:
            print(f"Warning: Skipping {file_path}, column count mismatch ({len(feature_cols)} != {TOTAL_FEATURES})")
            continue

        raw_x = df[feature_cols].values
        labels = df["label"].values

        for i in range(len(raw_x)):
            try:
                norm_feat = normalize_landmarks(raw_x[i])
                all_features.append(norm_feat)
                all_labels.append(str(labels[i]).strip())
            except Exception as e:
                continue

    X = np.array(all_features, dtype=np.float32)
    y = np.array(all_labels)
    print(f"Loaded {len(X)} total samples across {len(np.unique(y))} unique classes.")
    return X, y


def train_model(dataset_dir: str = "dataset", models_dir: str = "models"):
    os.makedirs(models_dir, exist_ok=True)
    X, y = load_dataset(dataset_dir)

    # Encode labels
    label_encoder = LabelEncoder()
    y_encoded = label_encoder.fit_transform(y)
    classes = label_encoder.classes_
    print(f"Classes ({len(classes)}): {list(classes)}")

    # Split dataset
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
    )

    print(f"\nTraining RandomForestClassifier (100 estimators)...")
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=16,
        min_samples_split=2,
        random_state=42,
        n_jobs=-1
    )
    model.fit(X_train, y_train)

    # Evaluate
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"\n=== Model Evaluation Results ===")
    print(f"Test Accuracy: {acc * 100:.2f}%\n")
    print("Classification Report:")
    print(classification_report(y_test, y_pred, target_names=classes))

    print("Confusion Matrix:")
    cm = confusion_matrix(y_test, y_pred)
    print(cm)

    # Save artifacts
    model_path = os.path.join(models_dir, "gesture_model.pkl")
    encoder_path = os.path.join(models_dir, "label_encoder.pkl")
    
    joblib.dump(model, model_path)
    joblib.dump(label_encoder, encoder_path)
    print(f"\nModel saved successfully -> {model_path}")
    print(f"Label encoder saved successfully -> {encoder_path}")

    return model, label_encoder


if __name__ == "__main__":
    train_model()
