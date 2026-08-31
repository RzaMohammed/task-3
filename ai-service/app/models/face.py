from typing import List, Optional
from pydantic import BaseModel, Field

class FaceData(BaseModel):
    face_id: int = Field(..., description="Index ID of the detected face in the image")
    bbox: List[int] = Field(..., description="Bounding box [x1, y1, x2, y2] in pixel coordinates")
    detection_confidence: float = Field(..., description="Face detector confidence score (0.0 - 1.0)")

class FaceAnalysisResponse(BaseModel):
    success: bool = True
    face_detected: bool = True
    face_count: int = 1
    selected_face: FaceData
    embedding_generated: bool = True
    embedding_dimension: int = 512
    embedding: Optional[List[float]] = Field(None, description="Optional 512-D embedding vector (when requested)")

class ErrorDetail(BaseModel):
    code: str
    message: str

class ErrorResponse(BaseModel):
    success: bool = False
    error: ErrorDetail
    face_count: Optional[int] = None

class HealthResponse(BaseModel):
    success: bool = True
    service: str = "ai-service"
    status: str = "running"
    model_loaded: bool = False
