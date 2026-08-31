import logging
from typing import Optional
from fastapi import APIRouter, File, UploadFile, Query
from app.models.face import FaceAnalysisResponse, FaceData
from app.utils.image import validate_and_decode_image
from app.utils.errors import (
    NoFaceDetectedException,
    MultipleFacesDetectedException
)
from app.services.face_detection import FaceDetectionService
from app.services.face_embedding import FaceEmbeddingService
from app.config import settings

logger = logging.getLogger("face-service")

router = APIRouter(prefix="/api/face", tags=["Face Analysis"])

@router.post("/analyze", response_model=FaceAnalysisResponse)
async def analyze_face(
    image: UploadFile = File(..., description="Image file containing a single face"),
    include_embedding: bool = Query(False, description="Include the raw 512-D float embedding vector in the response")
):
    """
    Analyzes an uploaded image:
    1. Validates file size and decodes image in-memory.
    2. Runs face detection via InsightFace.
    3. Rejects images with 0 faces (NO_FACE_DETECTED) or >1 faces (MULTIPLE_FACES_DETECTED).
    4. Generates a 512-D normalized face embedding for the selected face.
    """
    logger.info(f"[FACE] Image received: {image.filename or 'upload'}")
    
    # Read bytes into memory
    file_bytes = await image.read()
    
    # Decode and validate image
    img_bgr = validate_and_decode_image(file_bytes, filename=image.filename or "")
    
    # Run face detection
    faces = FaceDetectionService.detect_faces(img_bgr)
    face_count = len(faces)
    
    if face_count == 0:
        logger.info("[FACE] No face detected")
        raise NoFaceDetectedException()
        
    if face_count > 1:
        logger.info(f"[FACE] Multiple faces detected (count: {face_count})")
        raise MultipleFacesDetectedException(face_count=face_count)
        
    # Process single face
    selected_face_obj = faces[0]
    
    # Extract integer bounding box [x1, y1, x2, y2]
    if hasattr(selected_face_obj.bbox, "astype"):
        bbox_raw = selected_face_obj.bbox.astype(int).tolist()
    else:
        bbox_raw = [int(x) for x in selected_face_obj.bbox]
        
    confidence = float(selected_face_obj.det_score) if hasattr(selected_face_obj, "det_score") else 1.0
    
    # Extract 512-D embedding
    embedding_vector = FaceEmbeddingService.extract_embedding(selected_face_obj)
    
    selected_face = FaceData(
        face_id=0,
        bbox=bbox_raw,
        detection_confidence=round(confidence, 4)
    )
    
    return FaceAnalysisResponse(
        success=True,
        face_detected=True,
        face_count=1,
        selected_face=selected_face,
        embedding_generated=True,
        embedding_dimension=len(embedding_vector),
        embedding=embedding_vector if include_embedding else None
    )
