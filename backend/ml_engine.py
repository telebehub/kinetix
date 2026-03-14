"""
Kinetix ML Engine - Extracted from Kinextix_AI_baku_metro.ipynb
XGBoost regression model for Baku Metro passenger prediction.

This module contains:
1. KinetixFeatureEngineer - Feature engineering pipeline
2. KinetixPredictor - Model inference class
3. MockPredictor - Fallback when no trained model is available
"""

import os
import re
import json
import math
import random
import unicodedata
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

import pandas as pd
import numpy as np

logger = logging.getLogger(__name__)

# ─── Baku Metro Stations (real data) ───
BAKU_METRO_STATIONS = [
    "Icherisheher", "Sahil", "28 May", "Ganjlik",
    "Nariman Narimanov", "Ulduz", "Koroglu", "Neftchilar",
    "Elmler Akademiyasi", "Nizami", "Memar Ajami",
    "20 Yanvar", "Inshaatchilar", "Khatai", "Avtovagzal",
    "8 Noyabr", "Hazi Aslanov", "Ahmadli", "Khalglar Dostlugu",
    "Bakmil", "Darnagul",
]

STATION_CAPACITIES = {
    "28 May": 8000,
    "Koroglu": 6000,
    "Nariman Narimanov": 5500,
    "Sahil": 5000,
    "Icherisheher": 4500,
    "Ganjlik": 5000,
    "Elmler Akademiyasi": 5500,
    "Nizami": 4000,
    "Ulduz": 4000,
    "Neftchilar": 3500,
    "Memar Ajami": 6000,
    "20 Yanvar": 3500,
    "Inshaatchilar": 4000,
    "Khatai": 3500,
    "Avtovagzal": 4500,
    "8 Noyabr": 3000,
    "Hazi Aslanov": 3500,
    "Ahmadli": 3000,
    "Khalglar Dostlugu": 4000,
    "Bakmil": 3000,
    "Darnagul": 3000,
}

# ─── Azerbaijan Holidays ───
MAJOR_HOLIDAYS = {
    "2024-01-01", "2024-01-02", "2024-03-08",
    "2024-03-20", "2024-03-21", "2024-03-22", "2024-03-23", "2024-03-24",
    "2024-05-09", "2024-05-28", "2024-06-15", "2024-06-26",
    "2024-11-08", "2024-11-09", "2024-12-31",
    "2025-01-01", "2025-01-02", "2025-03-08",
    "2025-03-20", "2025-03-21", "2025-03-22", "2025-03-23", "2025-03-24",
    "2025-05-09", "2025-05-28", "2025-06-15", "2025-06-26",
    "2025-11-08", "2025-11-09", "2025-12-31",
    "2026-01-01", "2026-01-02", "2026-03-08",
    "2026-03-20", "2026-03-21", "2026-03-22", "2026-03-23", "2026-03-24",
    "2026-05-09", "2026-05-28", "2026-06-15", "2026-06-26",
    "2026-11-08", "2026-11-09", "2026-12-31",
}


def normalize_text(value: str) -> str:
    """Normalize station name for matching."""
    return "".join(ch.lower() for ch in value if ch.isalnum())


def is_holiday_az(target_date: datetime) -> bool:
    return target_date.strftime("%Y-%m-%d") in MAJOR_HOLIDAYS


def is_academic_season(target_date: datetime) -> bool:
    month = target_date.month
    day = target_date.day
    in_season = (month > 9 or (month == 9 and day >= 15)) or (month < 6 or (month == 5 and day <= 31))
    return in_season and month != 1


class KinetixPredictor:
    """
    Production inference class extracted from notebook Cell 10.
    Loads a trained XGBoost model and feature schema for predictions.
    """

    def __init__(self, model_dir: str = "models/"):
        self.model_dir = model_dir
        self.model = None
        self.features = None
        self.loaded = False

        model_path = os.path.join(self.model_dir, "kinetix_xgboost_v1.joblib")
        schema_path = os.path.join(self.model_dir, "feature_schema.json")

        try:
            import joblib
            self.model = joblib.load(model_path)
            with open(schema_path, "r", encoding="utf-8") as f:
                self.features = json.load(f)
            self.loaded = True
            logger.info("KinetixPredictor loaded successfully from %s", model_dir)
        except FileNotFoundError:
            logger.warning("Model files not found in %s - using mock predictor", model_dir)
        except Exception as e:
            logger.error("Failed to load model: %s", e)

    def _prepare_features(self, target_date: str, target_time: str, station_name: str) -> pd.DataFrame:
        request_dt = datetime.strptime(f"{target_date} {target_time}", "%Y-%m-%d %H:%M")

        hour = request_dt.hour
        day_of_week = request_dt.weekday()
        month = request_dt.month
        minute_of_day = hour * 60 + request_dt.minute

        is_weekend = day_of_week >= 5
        is_rush_hour = (450 <= minute_of_day <= 570) or (1050 <= minute_of_day <= 1170)
        academic = is_academic_season(request_dt)
        holiday = is_holiday_az(request_dt)

        normalized_station = normalize_text(station_name)
        transfer_hubs = {normalize_text("28 May"), normalize_text("Memar Ajami")}
        student_hubs = {normalize_text("Elmler Akademiyasi"), normalize_text("Genclik")}

        aligned_df = pd.DataFrame([[0] * len(self.features)], columns=self.features)

        computed = {
            "hour": hour,
            "day_of_week": day_of_week,
            "month": month,
            "is_weekend": int(is_weekend),
            "is_rush_hour": int(is_rush_hour),
            "is_academic_season": int(academic),
            "is_holiday_az": int(holiday),
            "is_transfer_hub": int(normalized_station in transfer_hubs),
            "is_student_hub": int(normalized_station in student_hubs),
        }

        for name, val in computed.items():
            if name in aligned_df.columns:
                aligned_df.at[0, name] = val

        direct_col = f"station_{station_name}"
        if direct_col in aligned_df.columns:
            aligned_df.at[0, direct_col] = 1
        else:
            norm_target = normalize_text(direct_col)
            for col in aligned_df.columns:
                if col.startswith("station_") and normalize_text(col) == norm_target:
                    aligned_df.at[0, col] = 1
                    break

        return aligned_df

    def predict(self, target_date: str, target_time: str, station_name: str, station_capacity: int = 5000) -> dict:
        if not self.loaded:
            raise RuntimeError("Model not loaded. Please upload trained model files.")

        inference_df = self._prepare_features(target_date, target_time, station_name)
        raw_prediction = float(self.model.predict(inference_df)[0])
        predicted_passengers = max(0, int(raw_prediction))

        occupancy_pct = (predicted_passengers / station_capacity) * 100 if station_capacity > 0 else 0.0

        if occupancy_pct < 40:
            comfort = "Comfortable (Seats likely available)"
            comfort_level = "low"
        elif occupancy_pct <= 75:
            comfort = "Moderate (Standing room only)"
            comfort_level = "medium"
        else:
            comfort = "Crowded (Expect delays)"
            comfort_level = "high"

        return {
            "station": station_name,
            "date": target_date,
            "time": target_time,
            "predicted_passengers": predicted_passengers,
            "station_capacity": station_capacity,
            "occupancy_percentage": round(occupancy_pct, 1),
            "comfort_status": comfort,
            "comfort_level": comfort_level,
            "model_type": "xgboost_trained",
        }


class MockPredictor:
    """
    Realistic mock predictor based on notebook feature engineering logic.
    Used when no trained model is available.
    """

    def predict(self, target_date: str, target_time: str, station_name: str, station_capacity: int = 5000) -> dict:
        dt = datetime.strptime(f"{target_date} {target_time}", "%Y-%m-%d %H:%M")
        hour = dt.hour
        day_of_week = dt.weekday()
        minute_of_day = hour * 60 + dt.minute

        # Base passenger flow simulation
        base = station_capacity * 0.3

        # Rush hour effect (7:30-9:30 and 17:30-19:30)
        if 450 <= minute_of_day <= 570:  # Morning rush
            base *= 1.8
        elif 1050 <= minute_of_day <= 1170:  # Evening rush
            base *= 1.6
        elif 360 <= minute_of_day <= 450:  # Early morning ramp
            base *= 1.2
        elif 570 <= minute_of_day <= 720:  # Late morning
            base *= 1.1
        elif 720 <= minute_of_day <= 1050:  # Midday
            base *= 0.7
        elif minute_of_day > 1320:  # Late night
            base *= 0.2
        elif minute_of_day < 360:  # Very early
            base *= 0.1

        # Weekend effect
        if day_of_week >= 5:
            base *= 0.55

        # Holiday effect
        if is_holiday_az(dt):
            base *= 0.35

        # Academic season boost
        if is_academic_season(dt):
            base *= 1.15

        # Transfer hub bonus
        norm_station = normalize_text(station_name)
        if norm_station in {normalize_text("28 May"), normalize_text("Memar Ajami")}:
            base *= 1.4
        elif norm_station in {normalize_text("Elmler Akademiyasi"), normalize_text("Genclik")}:
            base *= 1.2
        elif norm_station in {normalize_text("Koroglu"), normalize_text("Nariman Narimanov")}:
            base *= 1.25

        # Add realistic noise
        noise = random.gauss(0, base * 0.08)
        predicted = max(0, int(base + noise))

        occupancy_pct = (predicted / station_capacity) * 100 if station_capacity > 0 else 0.0

        if occupancy_pct < 40:
            comfort = "Comfortable (Seats likely available)"
            comfort_level = "low"
        elif occupancy_pct <= 75:
            comfort = "Moderate (Standing room only)"
            comfort_level = "medium"
        else:
            comfort = "Crowded (Expect delays)"
            comfort_level = "high"

        return {
            "station": station_name,
            "date": target_date,
            "time": target_time,
            "predicted_passengers": predicted,
            "station_capacity": station_capacity,
            "occupancy_percentage": round(occupancy_pct, 1),
            "comfort_status": comfort,
            "comfort_level": comfort_level,
            "model_type": "mock_simulation",
        }


def get_predictor(model_dir: str = "models/") -> object:
    """Get the best available predictor."""
    predictor = KinetixPredictor(model_dir)
    if predictor.loaded:
        return predictor
    logger.info("Using MockPredictor as fallback")
    return MockPredictor()


def extract_notebook_model(notebook_path: str, output_dir: str = "models/") -> dict:
    """
    Process an uploaded .ipynb file:
    1. Extract Python code cells
    2. Look for model artifacts (joblib files, schemas)
    3. Save extracted code as modular Python
    """
    import nbformat

    os.makedirs(output_dir, exist_ok=True)

    with open(notebook_path, "r", encoding="utf-8") as f:
        nb = nbformat.read(f, as_version=4)

    code_cells = [cell for cell in nb.cells if cell.cell_type == "code"]
    extracted_code = "\n\n".join(["".join(cell.source) for cell in code_cells])

    # Save extracted code
    code_path = os.path.join(output_dir, "extracted_notebook_code.py")
    with open(code_path, "w", encoding="utf-8") as f:
        f.write(extracted_code)

    # Check for model training patterns
    has_xgboost = "xgb" in extracted_code.lower() or "xgboost" in extracted_code.lower()
    has_predictor = "KinetixPredictor" in extracted_code
    has_feature_engineer = "KinetixFeatureEngineer" in extracted_code

    return {
        "total_cells": len(nb.cells),
        "code_cells": len(code_cells),
        "extracted_code_path": code_path,
        "has_xgboost": has_xgboost,
        "has_predictor_class": has_predictor,
        "has_feature_engineer": has_feature_engineer,
        "status": "extracted",
    }
