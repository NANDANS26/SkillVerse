# Backend/app/core/ranker.py
import pickle
import numpy as np
import os
from typing import Dict, Any

def resolve_path(path_str: str) -> str:
    if os.path.isabs(path_str) and os.path.exists(path_str):
        return path_str
    if os.path.exists(path_str):
        return os.path.abspath(path_str)
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    candidate = os.path.join(base_dir, path_str)
    if os.path.exists(candidate):
        return candidate
    return path_str

class Ranker:
    def __init__(self, model_path: str = "models/ranker.pkl"):
        resolved_path = resolve_path(model_path)
        if not os.path.exists(resolved_path):
            raise FileNotFoundError(f"Ranker model artifact not found at: {resolved_path}")

        with open(resolved_path, "rb") as f:
            self.model = pickle.load(f)

    def score(self, item: Dict[str, Any]) -> float:
        X = np.array([[
            float(item.get("embedding_sim", 0.0)),
            float(item.get("skill_overlap", 0.0)),
            float(item.get("exp_match", 0.0))
        ]])
        prediction = self.model.predict(X)
        return float(prediction[0])
