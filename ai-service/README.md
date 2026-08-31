# AI Service — Module 2: Face Detection & Face Encoding

FastAPI microservice utilizing **InsightFace** (`buffalo_l`) and **OpenCV** to perform face detection, face validation, and 512-dimensional face embedding extraction.

---

## 1. Overview of Module 2

Module 2 implements the face-analysis tier:
*   **Face Detection**: Detects all human faces in an image using RetinaFace / InsightFace detectors.
*   **Face Count Validation**:
    *   Images containing exactly **1 face** are processed and their 512-D embeddings are generated.
    *   Images containing **0 faces** return `NO_FACE_DETECTED` (HTTP 400).
    *   Images containing **multiple faces** return `MULTIPLE_FACES_DETECTED` (HTTP 400) to ensure reliable downstream identity queries.
*   **Face Embedding**: Generates a normalized 512-dimensional numerical vector for the selected face.
*   **In-Memory Processing**: File bytes are validated and decoded directly in memory; no permanent disk storage is used.

---

## 2. Installation & Setup

### Prerequisites
*   Python 3.11+
*   Virtual environment (`.venv`)

### Setup Commands
```bash
cd ai-service

# Create virtual environment (if not already created)
python -m venv .venv

# Activate virtual environment
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

---

## 3. Running the Service

```bash
# Start FastAPI service on port 8000
uvicorn app.main:app --port 8000 --reload
```

The interactive Swagger UI is available at:
`http://localhost:8000/docs`

---

## 4. API Endpoints

### 4.1. Health Check
```http
GET /health
```
**Response (HTTP 200)**:
```json
{
  "success": true,
  "service": "ai-service",
  "status": "running",
  "model_loaded": true
}
```

---

### 4.2. Face Analysis
```http
POST /api/face/analyze
```
**Content-Type**: `multipart/form-data`  
**Parameters**:
*   `image`: Binary image file (`.jpg`, `.jpeg`, `.png`, `.webp` up to 10 MB).
*   `include_embedding` *(optional query param)*: `true`/`false` (Default `false`).

#### Example Request:
```bash
curl -X POST http://localhost:8000/api/face/analyze \
  -F "image=@sample_face.jpg"
```

#### Successful Response (1 Face Detected):
```json
{
  "success": true,
  "face_detected": true,
  "face_count": 1,
  "selected_face": {
    "face_id": 0,
    "bbox": [120, 80, 420, 430],
    "detection_confidence": 0.9824
  },
  "embedding_generated": true,
  "embedding_dimension": 512
}
```

---

## 5. Error Responses

| HTTP Status | Error Code | Scenario | Response Payload Example |
| :--- | :--- | :--- | :--- |
| `400 Bad Request` | `NO_FACE_DETECTED` | No human face detected in image | `{"success": false, "error": {"code": "NO_FACE_DETECTED", "message": "No detectable face was found in the uploaded image."}}` |
| `400 Bad Request` | `MULTIPLE_FACES_DETECTED` | Multiple faces found in image | `{"success": false, "error": {"code": "MULTIPLE_FACES_DETECTED", "message": "Multiple faces were detected. Please upload an image containing one face."}, "face_count": 3}` |
| `400 Bad Request` | `INVALID_IMAGE` | 0-byte or corrupted file | `{"success": false, "error": {"code": "INVALID_IMAGE", "message": "Uploaded file is empty (0 bytes)."}}` |
| `400 Bad Request` | `UNSUPPORTED_IMAGE_FORMAT` | Disallowed file extension | `{"success": false, "error": {"code": "UNSUPPORTED_IMAGE_FORMAT", "message": "File extension 'pdf' is not supported."}}` |
| `400 Bad Request` | `IMAGE_TOO_LARGE` | File exceeds 10 MB limit | `{"success": false, "error": {"code": "IMAGE_TOO_LARGE", "message": "Uploaded image file size exceeds the allowed limit of 10 MB."}}` |

---

## 6. Privacy & Ethical Guidelines

*   **No Permanent Storage**: Uploaded face images are decoded in-memory and discarded immediately after inference.
*   **No Sensitive Vector Logging**: 512-D embedding vectors and raw image bytes are strictly excluded from logging.
*   **User Consent**: This prototype processes biometric facial representations. Ensure uploaded imagery is used strictly with appropriate consent and complies with applicable data privacy regulations.
