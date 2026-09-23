"""
Semantic Embeddings and Similarity Computation Module
Provides dense vector representations and TF-IDF / Cosine Similarity fallbacks.
"""

import os
import math
import re
from typing import List, Dict, Any

try:
    from sentence_transformers import SentenceTransformer
    _SENTENCE_TRANSFORMER_AVAILABLE = True
except ImportError:
    _SENTENCE_TRANSFORMER_AVAILABLE = False

class EmbeddingEngine:
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        self.model_name = model_name
        self.model = None
        if _SENTENCE_TRANSFORMER_AVAILABLE:
            try:
                self.model = SentenceTransformer(model_name)
            except Exception as e:
                print(f"[EmbeddingEngine] Warning: Could not load SentenceTransformer ({e}). Using TF-IDF fallback.")
                self.model = None
                
    def get_embedding(self, text: str) -> List[float]:
        """Compute dense embedding for a given text."""
        if not text or not text.strip():
            return [0.0] * 64
            
        if self.model is not None:
            try:
                vec = self.model.encode(text, convert_to_numpy=True)
                return vec.tolist()
            except Exception:
                pass
                
        # Fast Deterministic Character & N-gram Hashed Vector (Fallback)
        return self._hash_vector(text)

    def _hash_vector(self, text: str, dim: int = 64) -> List[float]:
        vec = [0.0] * dim
        tokens = re.findall(r'\w+', text.lower())
        if not tokens:
            return vec
        for tok in tokens:
            h = hash(tok) % dim
            vec[h] += 1.0
        # Normalize
        norm = math.sqrt(sum(v * v for v in vec))
        if norm > 0:
            vec = [v / norm for v in vec]
        return vec

    def compute_similarity(self, text1: str, text2: str) -> float:
        """Compute cosine similarity between two texts (0.0 to 1.0)."""
        if not text1 or not text2:
            return 0.0
            
        v1 = self.get_embedding(text1)
        v2 = self.get_embedding(text2)
        
        dot_product = sum(a * b for a, b in zip(v1, v2))
        norm1 = math.sqrt(sum(a * a for a in v1))
        norm2 = math.sqrt(sum(b * b for b in v2))
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
        return max(0.0, min(1.0, dot_product / (norm1 * norm2)))

    def rank_items(self, query: str, items: List[str], top_k: int = 5) -> List[Dict[str, Any]]:
        """Rank a list of candidates against query by semantic similarity."""
        scored = []
        for it in items:
            score = self.compute_similarity(query, it)
            scored.append({"item": it, "score": round(score, 4)})
        scored.sort(key=lambda x: x["score"], reverse=True)
        return scored[:top_k]

# Global singleton
embedding_engine = EmbeddingEngine()
