import io
import os
import sys
import numpy as np
from PIL import Image, ImageDraw
import pytest
from fastapi.testclient import TestClient

# Ensure ai-service root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app

client = TestClient(app)

def create_blank_image(width=300, height=300, color=(128, 128, 128)) -> bytes:
    """Creates a synthetic solid-color image with no face."""
    img = Image.new("RGB", (width, height), color=color)
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()

def create_test_face_image() -> bytes:
    """
    Creates a synthetic face-like drawing or draws an oval with facial landmarks.
    Note: Real InsightFace models look for realistic facial textures.
    """
    img = Image.new("RGB", (400, 400), color=(240, 240, 240))
    draw = ImageDraw.Draw(img)
    # Head oval
    draw.ellipse([100, 80, 300, 320], fill=(255, 219, 172), outline=(0, 0, 0))
    # Eyes
    draw.ellipse([140, 140, 170, 170], fill=(255, 255, 255), outline=(0, 0, 0))
    draw.ellipse([150, 150, 160, 160], fill=(0, 0, 0))
    draw.ellipse([230, 140, 260, 170], fill=(255, 255, 255), outline=(0, 0, 0))
    draw.ellipse([240, 150, 250, 160], fill=(0, 0, 0))
    # Nose
    draw.polygon([(200, 180), (190, 230), (210, 230)], fill=(220, 180, 140))
    # Mouth
    draw.arc([160, 240, 240, 280], start=0, end=180, fill=(180, 50, 50), width=3)
    
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()

def test_health_endpoint():
    """Verify GET /health returns running status."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["service"] == "ai-service"
    assert data["status"] == "running"
    assert "model_loaded" in data

def test_no_face_detected():
    """Test 2 — Image with no face returns NO_FACE_DETECTED."""
    blank_bytes = create_blank_image()
    response = client.post(
        "/api/face/analyze",
        files={"image": ("blank.jpg", blank_bytes, "image/jpeg")}
    )
    assert response.status_code == 400
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "NO_FACE_DETECTED"
    assert "No detectable face" in data["error"]["message"]

def test_empty_upload():
    """Test 5 — Empty 0-byte file returns INVALID_IMAGE."""
    response = client.post(
        "/api/face/analyze",
        files={"image": ("empty.jpg", b"", "image/jpeg")}
    )
    assert response.status_code == 400
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "INVALID_IMAGE"

def test_invalid_corrupted_file():
    """Test 4 — Non-image plain text file returns INVALID_IMAGE."""
    invalid_bytes = b"This is not a real image file content."
    response = client.post(
        "/api/face/analyze",
        files={"image": ("fake.jpg", invalid_bytes, "image/jpeg")}
    )
    assert response.status_code == 400
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "INVALID_IMAGE"

def test_unsupported_extension():
    """Test unsupported file format rejection."""
    response = client.post(
        "/api/face/analyze",
        files={"image": ("document.pdf", b"%PDF-1.4 ...", "application/pdf")}
    )
    assert response.status_code == 400
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] in ["UNSUPPORTED_IMAGE_FORMAT", "INVALID_IMAGE"]

if __name__ == "__main__":
    pytest.main(["-v", __file__])
