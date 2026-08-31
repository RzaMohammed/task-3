from fastapi import APIRouter
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
        model_loaded=FaceDetectionService.is_loaded()
    )
