# API Reference Specification

This document details the REST API endpoints exposed by the Node.js backend orchestrator.

---

## 1. System Health Status

### `GET /api/health`
Returns runtime details, connectivity check results to downstream services, and active blockchain configurations.

* **Response Status**: `200 OK`
* **Response Body**:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "node_version": "v20.12.2",
    "services": {
      "ai_service": "UP",
      "blockchain": "UP"
    },
    "blockchain_config": {
      "network": "devnet",
      "public_key": "4A1vL1v...",
      "rpc_url": "https://api.devnet.solana.com"
    }
  }
}
```

---

## 2. Standalone Face Detection

### `POST /api/face/detect`
Accepts a multipart file upload, calls the Python AI service to extract bounding box coordinates, and returns detection results.

* **Request Content-Type**: `multipart/form-data`
* **Form Field**: `image` (JPEG, PNG, or WebP file)
* **Response Status**: `200 OK`
* **Response Body**:
```json
{
  "success": true,
  "data": {
    "faceDetected": true,
    "faceCount": 1,
    "embeddingGenerated": true,
    "embeddingDimension": 512,
    "faces": [
      {
        "x1": 120.45,
        "y1": 80.22,
        "x2": 240.80,
        "y2": 260.15,
        "confidence": 0.985
      }
    ]
  }
}
```

---

## 3. Standalone Visual Web Search

### `POST /api/search`
Accepts a multipart file upload, uploads the file to SerpApi Google Lens engine (or simulates using mock data), and returns normalized candidates.

* **Request Content-Type**: `multipart/form-data`
* **Form Field**: `image` (JPEG, PNG, or WebP file)
* **Response Status**: `200 OK`
* **Response Body**:
```json
{
  "success": true,
  "data": {
    "candidatesCount": 4,
    "candidates": [
      {
        "url": "https://en.wikipedia.org/wiki/Elon_Musk",
        "title": "Elon Musk - Wikipedia Profile",
        "source": "Wikipedia",
        "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/8/85/Elon_Musk_Royal_Society.jpg",
        "thumbnailUrl": "https://upload.wikimedia.org/wikipedia/commons/8/85/Elon_Musk_Royal_Society.jpg",
        "description": "Biography details...",
        "metadata": {
          "similarity": 0.99
        }
      }
    ]
  }
}
```

---

## 4. Run Complete Verification Pipeline

### `POST /api/pipeline/run`
Uploads a face image, detects features, queries visual search results, downloads candidate photos to run face comparison checks, hashes matched results recursively, logs hashes to Solana Devnet, and returns the verification receipt.

* **Request Content-Type**: `multipart/form-data`
* **Form Field**: `image` (JPEG, PNG, or WebP file)
* **Response Status**: `200 OK`
* **Response Body**:
```json
{
  "success": true,
  "data": {
    "faceAnalysis": {
      "faceDetected": true,
      "faceCount": 1,
      "embeddingGenerated": true,
      "embeddingDimension": 512
    },
    "searchResult": {
      "candidatesCount": 4,
      "candidates": [...]
    },
    "matchResult": {
      "matchFound": true,
      "confidence": 0.965,
      "candidate": {
        "url": "https://en.wikipedia.org/wiki/Elon_Musk",
        "title": "Elon Musk - Wikipedia Profile",
        "source": "Wikipedia"
      }
    },
    "postData": {
      "url": "https://en.wikipedia.org/wiki/Elon_Musk",
      "title": "Elon Musk - Wikipedia Profile",
      "source": "Wikipedia",
      "imageUrl": "...",
      "description": "..."
    },
    "hash": "8f3e58ca...",
    "blockchainTx": {
      "status": "RECORDED",
      "transactionId": "5B1vL5v...",
      "network": "devnet"
    },
    "verificationResult": {
      "verified": true,
      "status": "VERIFIED",
      "currentHash": "8f3e58ca...",
      "blockchainHash": "8f3e58ca...",
      "transactionId": "5B1vL5v..."
    }
  }
}
```

---

## 5. Independent Blockchain Verification

### `POST /api/blockchain/verify`
Receives a post data structure and a transaction ID, fetches the stored fingerprint from Solana, recalculates the deterministic hash of the inputs, and evaluates integrity.

* **Request Content-Type**: `application/json`
* **Request Body**:
```json
{
  "transaction_id": "5B1vL5v...",
  "post_data": {
    "url": "https://en.wikipedia.org/wiki/Elon_Musk",
    "title": "Elon Musk - Wikipedia Profile",
    "source": "Wikipedia",
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/8/85/Elon_Musk_Royal_Society.jpg",
    "thumbnailUrl": "https://upload.wikimedia.org/wikipedia/commons/8/85/Elon_Musk_Royal_Society.jpg",
    "description": "Biography details...",
    "metadata": {
      "category": "public_figure"
    }
  }
}
```
* **Response Status**: `200 OK`
* **Response Body (Success / Matching)**:
```json
{
  "success": true,
  "data": {
    "verified": true,
    "status": "VERIFIED",
    "currentHash": "8f3e58ca...",
    "blockchainHash": "8f3e58ca...",
    "transactionId": "5B1vL5v..."
  }
}
```
* **Response Body (Failed / Modified / Tampered)**:
```json
{
  "success": true,
  "data": {
    "verified": false,
    "status": "TAMPERED",
    "currentHash": "9b121ab...",
    "blockchainHash": "8f3e58ca...",
    "transactionId": "5B1vL5v..."
  }
}
```
