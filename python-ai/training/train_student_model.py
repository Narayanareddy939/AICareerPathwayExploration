"""
train_student_model.py
Supervised ML pipeline for student placement/career prediction.

Dataset: Datasets/raw/student_placement_career_success.csv
Target: placement_status (binary: Placed / Not Placed)

Models compared:
  1. Logistic Regression
  2. Random Forest Classifier
  3. Gradient Boosting Classifier

Evaluation: Accuracy, Precision, Recall, F1, ROC-AUC, Confusion Matrix
Output: python-ai/models/student_career_model.pkl, preprocessor.pkl, model_metadata.json
"""

import os, sys, json, warnings
warnings.filterwarnings('ignore')

import pandas as pd
import numpy as np
from datetime import datetime

# ML imports
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.preprocessing import LabelEncoder, StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, roc_auc_score, confusion_matrix, classification_report
)
import pickle

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_PATH = os.path.join(BASE_DIR, "Datasets", "raw", "student_placement_career_success.csv")
PROCESSED_DIR = os.path.join(BASE_DIR, "Datasets", "processed")
MODELS_DIR = os.path.join(BASE_DIR, "python-ai", "models")

os.makedirs(PROCESSED_DIR, exist_ok=True)
os.makedirs(MODELS_DIR, exist_ok=True)


def load_and_audit(path: str) -> pd.DataFrame:
    """Load dataset and print full audit."""
    print("=" * 60)
    print("DATASET AUDIT")
    print("=" * 60)
    
    df = pd.read_csv(path, encoding='utf-8')
    
    print(f"Rows: {len(df)}")
    print(f"Columns: {len(df.columns)}")
    print(f"\nColumn names:\n{list(df.columns)}")
    print(f"\nData types:\n{df.dtypes.to_dict()}")
    print(f"\nMissing values:\n{df.isnull().sum().to_dict()}")
    print(f"\nDuplicates: {df.duplicated().sum()}")
    
    # Target distribution
    if "placement_status" in df.columns:
        print(f"\nTarget distribution (placement_status):")
        print(df["placement_status"].value_counts().to_dict())
        print(f"Class balance: {df['placement_status'].value_counts(normalize=True).round(3).to_dict()}")
    
    return df


def preprocess(df: pd.DataFrame):
    """
    Feature engineering and preprocessing.
    
    Features used:
      Numerical: cgpa, aptitude_score, coding_score, dsa_score,
                 communication_score, attendance_percentage,
                 projects_count, certifications_count
      Categorical: branch, degree, city_tier, college_tier, gender,
                   internship_experience, backlog_history
    
    Target: placement_status → binary (1=Placed, 0=Not Placed)
    
    LEAKAGE CHECK:
      - placement_probability: EXCLUDED (directly predicts target)
      - salary_lpa: EXCLUDED (only available post-placement)
      - preferred_role: EXCLUDED (not an input feature at prediction time)
      - student_id: EXCLUDED (identifier, not a feature)
    """
    print("\n" + "=" * 60)
    print("PREPROCESSING")
    print("=" * 60)
    
    # Drop rows with missing target
    df = df.dropna(subset=["placement_status"])
    
    # Encode target
    df["target"] = (df["placement_status"].str.strip() == "Placed").astype(int)
    print(f"Target encoded: Placed=1, Not Placed=0")
    print(f"Class distribution: {dict(df['target'].value_counts())}")
    
    # Define features (EXCLUDING leakage columns)
    numerical_features = [
        "cgpa", "aptitude_score", "coding_score", "dsa_score",
        "communication_score", "attendance_percentage",
        "projects_count", "certifications_count", "age"
    ]
    
    categorical_features = [
        "branch", "degree", "city_tier", "college_tier",
        "gender", "internship_experience", "backlog_history"
    ]
    
    # Validate all features exist
    numerical_features = [f for f in numerical_features if f in df.columns]
    categorical_features = [f for f in categorical_features if f in df.columns]
    
    print(f"\nNumerical features ({len(numerical_features)}): {numerical_features}")
    print(f"Categorical features ({len(categorical_features)}): {categorical_features}")
    print(f"\nEXCLUDED (leakage): placement_probability, salary_lpa, preferred_role, student_id")
    
    all_features = numerical_features + categorical_features
    X = df[all_features].copy()
    y = df["target"]
    
    # Preprocessing pipeline
    num_transformer = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
    ])
    
    cat_transformer = Pipeline([
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("encoder", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
    ])
    
    preprocessor = ColumnTransformer([
        ("num", num_transformer, numerical_features),
        ("cat", cat_transformer, categorical_features),
    ])
    
    # Save processed CSV
    processed_df = df[all_features + ["placement_status", "target"]].copy()
    processed_path = os.path.join(PROCESSED_DIR, "students_processed.csv")
    processed_df.to_csv(processed_path, index=False)
    print(f"\nProcessed dataset saved: {processed_path}")
    
    return X, y, preprocessor, numerical_features, categorical_features


def train_and_evaluate(X, y, preprocessor):
    """Train multiple models and compare performance."""
    print("\n" + "=" * 60)
    print("MODEL TRAINING & EVALUATION")
    print("=" * 60)
    
    # Stratified train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    print(f"\nTrain size: {len(X_train)} | Test size: {len(X_test)}")
    
    models = {
        "Logistic Regression": LogisticRegression(
            max_iter=1000, random_state=42, class_weight="balanced"
        ),
        "Random Forest": RandomForestClassifier(
            n_estimators=150, max_depth=8, random_state=42,
            class_weight="balanced", n_jobs=-1
        ),
        "Gradient Boosting": GradientBoostingClassifier(
            n_estimators=150, max_depth=4, learning_rate=0.1, random_state=42
        ),
    }
    
    results = {}
    best_model_name = None
    best_f1 = 0
    best_pipeline = None
    
    for name, model in models.items():
        print(f"\n--- {name} ---")
        
        # Build full pipeline
        pipeline = Pipeline([
            ("preprocessor", preprocessor),
            ("classifier", model),
        ])
        
        # Cross-validation (5-fold stratified)
        cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
        cv_scores = cross_val_score(pipeline, X_train, y_train, cv=cv, scoring="f1")
        print(f"CV F1 (5-fold): {cv_scores.round(4)} | Mean: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")
        
        # Fit on training set
        pipeline.fit(X_train, y_train)
        
        # Predict on test set
        y_pred = pipeline.predict(X_test)
        y_prob = pipeline.predict_proba(X_test)[:, 1]
        
        # Metrics
        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred, zero_division=0)
        rec = recall_score(y_test, y_pred, zero_division=0)
        f1 = f1_score(y_test, y_pred, zero_division=0)
        auc = roc_auc_score(y_test, y_prob)
        cm = confusion_matrix(y_test, y_pred).tolist()
        
        print(f"Test Accuracy:  {acc:.4f}")
        print(f"Test Precision: {prec:.4f}")
        print(f"Test Recall:    {rec:.4f}")
        print(f"Test F1:        {f1:.4f}")
        print(f"Test ROC-AUC:   {auc:.4f}")
        print(f"Confusion Matrix: {cm}")
        
        results[name] = {
            "accuracy": round(acc, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1_score": round(f1, 4),
            "roc_auc": round(auc, 4),
            "cv_f1_mean": round(cv_scores.mean(), 4),
            "cv_f1_std": round(cv_scores.std(), 4),
            "confusion_matrix": cm,
        }
        
        if f1 > best_f1:
            best_f1 = f1
            best_model_name = name
            best_pipeline = pipeline
    
    print(f"\n{'='*60}")
    print(f"BEST MODEL: {best_model_name} (F1={best_f1:.4f})")
    
    return best_pipeline, best_model_name, results, X_test, y_test


def save_model(pipeline, model_name: str, results: dict, 
               numerical_features: list, categorical_features: list,
               X_test, y_test):
    """Save model, preprocessor, and metadata."""
    print("\n" + "=" * 60)
    print("SAVING MODELS")
    print("=" * 60)
    
    # Save full pipeline (includes preprocessor)
    model_path = os.path.join(MODELS_DIR, "student_career_model.pkl")
    with open(model_path, "wb") as f:
        pickle.dump(pipeline, f)
    print(f"Model saved: {model_path}")
    
    # Save preprocessor separately
    preprocessor_path = os.path.join(MODELS_DIR, "preprocessor.pkl")
    with open(preprocessor_path, "wb") as f:
        pickle.dump(pipeline.named_steps["preprocessor"], f)
    print(f"Preprocessor saved: {preprocessor_path}")
    
    # Save metadata
    metadata = {
        "model_name": model_name,
        "trained_at": datetime.now().isoformat(),
        "dataset": "student_placement_career_success.csv",
        "target": "placement_status (Placed=1, Not Placed=0)",
        "numerical_features": numerical_features,
        "categorical_features": categorical_features,
        "excluded_features": ["placement_probability", "salary_lpa", "preferred_role", "student_id"],
        "exclusion_reason": "placement_probability and salary_lpa are post-placement data (leakage); preferred_role is target-adjacent",
        "metrics": results,
        "best_model": model_name,
        "train_test_split": "80/20 stratified",
        "cross_validation": "5-fold StratifiedKFold",
    }
    
    metadata_path = os.path.join(MODELS_DIR, "model_metadata.json")
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"Metadata saved: {metadata_path}")
    
    return metadata


def main():
    if not os.path.exists(DATA_PATH):
        print(f"ERROR: Dataset not found at {DATA_PATH}")
        sys.exit(1)
    
    print("AI Career Platform — Student Placement ML Pipeline")
    print(f"Dataset: {DATA_PATH}")
    
    # 1. Load & audit
    df = load_and_audit(DATA_PATH)
    
    # 2. Preprocess
    X, y, preprocessor, num_feats, cat_feats = preprocess(df)
    
    # 3. Train & evaluate
    best_pipeline, best_name, results, X_test, y_test = train_and_evaluate(X, y, preprocessor)
    
    # 4. Save
    metadata = save_model(best_pipeline, best_name, results, num_feats, cat_feats, X_test, y_test)
    
    print("\nTraining pipeline COMPLETE!")
    print(f"Best model: {metadata['best_model']}")
    best_metrics = metadata['metrics'][metadata['best_model']]
    print(f"F1: {best_metrics['f1_score']} | AUC: {best_metrics['roc_auc']} | Accuracy: {best_metrics['accuracy']}")
    
    return metadata


if __name__ == "__main__":
    main()
