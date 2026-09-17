from fastapi import APIRouter
from app.config import settings
from app.models.face import HealthResponse
from app.services.face_detection import FaceDetectionService

router = APIRouter(tags=["Health"])

@router.get("/health", response_model=HealthResponse)
def get_health():
    """Health check endpoint exposing service and model readiness."""
    return HealthResponse(
        success=True,
        service="ai-service",
        status="running",
        version=settings.VERSION,
        model_loaded=FaceDetectionService.is_loaded(),
        model_name=settings.MODEL_NAME
    )

@router.get("/ready")
def get_readiness():
    """Readiness probe endpoint for container orchestrators."""
    return {
        "ready": True,
        "service": "ai-service",
        "model_loaded": FaceDetectionService.is_loaded()
    }
