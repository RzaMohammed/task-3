import io
import cv2
import numpy as np
from PIL import Image, UnidentifiedImageError
from app.config import settings
from app.utils.errors import (
    InvalidImageException,
    UnsupportedImageFormatException,
    ImageTooLargeException
)

def validate_and_decode_image(file_bytes: bytes, filename: str = "") -> np.ndarray:
    """
    Validates uploaded image bytes in-memory and decodes into a standard 3-channel BGR OpenCV array.
    Rejects:
    - 0-byte or empty files
    - Files exceeding MAX_FILE_SIZE_MB
    - Unsupported extensions (if filename provided)
    - Corrupted or undecodable image bytes
    """
    if not file_bytes or len(file_bytes) == 0:
        raise InvalidImageException("Uploaded file is empty (0 bytes).")
    
    if len(file_bytes) > settings.MAX_FILE_SIZE_BYTES:
        raise ImageTooLargeException(settings.MAX_FILE_SIZE_MB)
    
    # Extension check if filename provided
    if filename:
        ext = filename.split(".")[-1].lower() if "." in filename else ""
        if ext and ext not in settings.ALLOWED_EXTENSIONS:
            raise UnsupportedImageFormatException(
                f"File extension '{ext}' is not supported. Allowed formats: {', '.join(settings.ALLOWED_EXTENSIONS)}"
            )

    # In-memory decoding using Pillow for deep validation & OpenCV for BGR conversion
    try:
        pil_img = Image.open(io.BytesIO(file_bytes))
        pil_img.verify()  # Verify image integrity
        
        # Re-open after verify() (Pillow requirement)
        pil_img = Image.open(io.BytesIO(file_bytes))
        
        # Convert mode if paletted or RGBA
        if pil_img.mode != "RGB":
            pil_img = pil_img.convert("RGB")
            
        img_np = np.array(pil_img)
        # Convert RGB to BGR for OpenCV / InsightFace
        img_bgr = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)
        
        if img_bgr is None or img_bgr.size == 0:
            raise InvalidImageException("Failed to decode image pixels.")
            
        return img_bgr
    except (UnidentifiedImageError, ValueError, cv2.error) as e:
        raise InvalidImageException(f"Corrupted or invalid image file: {str(e)}")
    except Exception as e:
        if isinstance(e, (InvalidImageException, UnsupportedImageFormatException, ImageTooLargeException)):
            raise e
        raise InvalidImageException(f"Unable to process image: {str(e)}")
