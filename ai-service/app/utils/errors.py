from fastapi import HTTPException, status

class FaceServiceException(HTTPException):
    """Base exception for face service errors."""
    def __init__(self, status_code: int, code: str, message: str, **kwargs):
        super().__init__(status_code=status_code, detail={"code": code, "message": message, **kwargs})
        self.code = code
        self.message = message
        self.extra = kwargs

class NoFaceDetectedException(FaceServiceException):
    def __init__(self, message: str = "No detectable face was found in the uploaded image."):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            code="NO_FACE_DETECTED",
            message=message
        )

class MultipleFacesDetectedException(FaceServiceException):
    def __init__(self, face_count: int, message: str = "Multiple faces were detected. Please upload an image containing one face."):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            code="MULTIPLE_FACES_DETECTED",
            message=message,
            face_count=face_count
        )

class InvalidImageException(FaceServiceException):
    def __init__(self, message: str = "The uploaded file is empty, corrupted, or not a valid image."):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            code="INVALID_IMAGE",
            message=message
        )

class UnsupportedImageFormatException(FaceServiceException):
    def __init__(self, message: str = "Unsupported image format. Allowed formats: jpg, jpeg, png, webp."):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            code="UNSUPPORTED_IMAGE_FORMAT",
            message=message
        )

class ImageTooLargeException(FaceServiceException):
    def __init__(self, max_mb: int = 10):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            code="IMAGE_TOO_LARGE",
            message=f"Uploaded image file size exceeds the allowed limit of {max_mb} MB."
        )
