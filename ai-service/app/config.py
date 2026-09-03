import os
from typing import List, Set

class Settings:
    PROJECT_NAME: str = "Face Identification AI Service"
    VERSION: str = "1.0.0"
    
    # Model Configuration
    MODEL_NAME: str = os.getenv("FACE_MODEL_NAME", "buffalo_l")
    MODEL_ROOT: str = os.getenv(
        "FACE_MODEL_ROOT",
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "models"))
    )
    DET_SIZE: tuple = (640, 640)
    PROVIDERS: List[str] = ["CPUExecutionProvider"]
    
    # File and Image Validation
    MAX_FILE_SIZE_MB: int = int(os.getenv("MAX_FILE_SIZE_MB", "10"))
    MAX_FILE_SIZE_BYTES: int = MAX_FILE_SIZE_MB * 1024 * 1024
    ALLOWED_EXTENSIONS: Set[str] = {"jpg", "jpeg", "png", "webp"}
    
    # Embedding Configuration
    EMBEDDING_DIMENSION: int = 512

settings = Settings()
