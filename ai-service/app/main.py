import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
from app.routes import health, face
from app.services.face_detection import FaceDetectionService
from app.utils.errors import FaceServiceException

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger("face-service")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager: Loads InsightFace model once during startup."""
    logger.info(f"[FACE] Starting {settings.PROJECT_NAME} (v{settings.VERSION})")
    try:
        FaceDetectionService.load_model()
    except Exception as e:
        logger.warning(f"[FACE] Model startup loading deferred: {str(e)}")
    yield
    logger.info("[FACE] Shutting down AI service")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="InsightFace Face Detection & 512-D Embedding Extraction Service",
    version=settings.VERSION,
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception Handlers
@app.exception_handler(FaceServiceException)
async def face_service_exception_handler(request: Request, exc: FaceServiceException):
    payload = {
        "success": False,
        "error": {
            "code": exc.code,
            "message": exc.message
        }
    }
    if "face_count" in exc.extra:
        payload["face_count"] = exc.extra["face_count"]
    return JSONResponse(status_code=exc.status_code, content=payload)

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"[FACE] Unhandled server error: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred during face processing."
            }
        }
    )

# Mount Routes
app.include_router(health.router)
app.include_router(face.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
