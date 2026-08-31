import logging
from typing import List
import numpy as np

logger = logging.getLogger("face-service")

class FaceEmbeddingService:
    @staticmethod
    def extract_embedding(face_obj) -> List[float]:
        """
        Extracts and normalizes the 512-D embedding from an InsightFace Face object.
        """
        logger.info("[FACE] Generating embedding")
        
        if hasattr(face_obj, "normed_embedding") and face_obj.normed_embedding is not None:
            embedding = face_obj.normed_embedding
        elif hasattr(face_obj, "embedding") and face_obj.embedding is not None:
            raw_emb = face_obj.embedding
            norm = np.linalg.norm(raw_emb)
            embedding = (raw_emb / norm) if norm > 0 else raw_emb
        else:
            raise ValueError("Face object does not contain an embedding vector.")
            
        logger.info(f"[FACE] Embedding generated (dimension: {len(embedding)})")
        return [float(x) for x in embedding]

face_embedder = FaceEmbeddingService()
