from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(
    title="Face Identification AI Service",
    description="Python FastAPI service for Face Identification (Module 1 Foundation)",
    version="1.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class HealthResponse(BaseModel):
    success: bool
    service: str
    status: str

@app.get("/health", response_model=HealthResponse)
def health_check():
    """Health check endpoint returning service status."""
    return HealthResponse(
        success=True,
        service="ai-service",
        status="running"
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
