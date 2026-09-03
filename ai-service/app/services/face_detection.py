import logging
from typing import List, Optional
import numpy as np
from app.config import settings

logger = logging.getLogger("face-service")

class FaceDetectionService:
    _instance: Optional["FaceDetectionService"] = None
    _app = None
    _model_loaded: bool = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(FaceDetectionService, cls).__new__(cls)
        return cls._instance

    @classmethod
    def load_model(cls):
        """Initializes InsightFace model pack once during application startup."""
        if cls._model_loaded:
            return
        
        try:
            logger.info(f"[FACE] Loading InsightFace model: {settings.MODEL_NAME}")
            import insightface
            from insightface.app import FaceAnalysis
            
            cls._app = FaceAnalysis(name=settings.MODEL_NAME, root=settings.MODEL_ROOT, providers=settings.PROVIDERS)
            cls._app.prepare(ctx_id=-1, det_size=settings.DET_SIZE)
            cls._model_loaded = True
            logger.info("[FACE] Model loaded successfully")
        except Exception as e:
            logger.error(f"[FACE] Failed to initialize InsightFace model: {str(e)}")
            cls._model_loaded = False
            raise e

    @classmethod
    def is_loaded(cls) -> bool:
        return cls._model_loaded

    @classmethod
    def detect_faces(cls, img_bgr: np.ndarray) -> list:
        """
        Runs face detection and alignment on the BGR image.
        Returns a list of InsightFace Face objects.
        """
        if not cls._model_loaded or cls._app is None:
            logger.info("[FACE] Lazy-loading InsightFace model on first inference")
            cls.load_model()
            
        logger.info("[FACE] Detecting faces")
        faces = cls._app.get(img_bgr)
        logger.info(f"[FACE] Faces detected: {len(faces)}")
        return faces

face_detector = FaceDetectionService()
