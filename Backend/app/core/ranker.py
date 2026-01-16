import pickle
import numpy as np

class Ranker:
    def __init__(self, model_path):
        self.model = pickle.load(open(model_path, "rb"))

    def score(self, item):
        X = np.array([[ item["embedding_sim"], 
                        item["skill_overlap"], 
                        item["exp_match"] ]])
        return float(self.model.predict(X)[0])
