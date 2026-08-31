# Visual Search Documentation & Demonstration Guide

This document details the architecture, provider integration, and configuration of the visual search component implemented in **Module 3**.

---

## 1. Selected Search Provider: SerpApi Google Lens Engine

### Why SerpApi Google Lens Was Selected
*   **Comprehensive Visual Indexing**: Google Lens is currently the most robust and accurate visual entity & reverse-image search engine available on the web.
*   **Direct Binary Upload Support**: Allows uploading raw image bytes (`multipart/form-data`) without requiring the host application to expose public S3/CDN image URLs.
*   **Rich Social Media Coverage**: Returns direct links to public posts and profiles across Instagram, Twitter/X, Facebook, TikTok, LinkedIn, and Reddit.
*   **Normalized Structured Output**: Delivers clean `visual_matches` arrays containing titles, original links, source identifiers, and high-resolution thumbnail URLs.

---

## 2. API Documentation & Reference
*   **Official SerpApi Google Lens Documentation**: [https://serpapi.com/google-lens-api](https://serpapi.com/google-lens-api)
*   **Endpoint**: `https://serpapi.com/search.json`
*   **Required Parameter**: `engine=google_lens`
*   **Authentication**: `api_key` parameter passed via environment variable `SEARCH_API_KEY`.

---

## 3. How the Pipeline Works

```text
Uploaded Image (Multipart Buffer)
              ↓
   Multer In-Memory Validator
              ↓
  SearchService Orchestrator
              ↓
    SearchProvider Interface
              ↓
SerpApiVisualSearchProvider (or Mock Provider)
              ↓
   SerpApi Google Lens API (POST /search.json)
              ↓
      Raw Visual Matches
              ↓
URL Validator & Domain Classifier (getSourcePlatform)
              ↓
 Normalized Candidate Posts (SearchResult[])
```

---

## 4. Example Request & Response

### Request
```bash
curl -X POST http://localhost:5000/api/search/image \
  -F "image=@portrait_sample.jpg"
```

### Successful Response (HTTP 200)
```json
{
  "success": true,
  "query_type": "visual_image_search",
  "result_count": 4,
  "results": [
    {
      "id": "match-1",
      "title": "Lena Forsen - Official Photography & Public Portrait Archive",
      "url": "https://www.instagram.com/p/C9xZ_example1/",
      "source": "instagram",
      "imageUrl": "https://images.unsplash.com/photo-1544005313-94ddf0286df2",
      "thumbnailUrl": "https://images.unsplash.com/photo-1544005313-94ddf0286df2",
      "description": "Official public social media portrait photo.",
      "publishedAt": null,
      "resultType": "social_media",
      "metadata": {}
    },
    {
      "id": "match-2",
      "title": "Public Profile & Keynote Speaker - Twitter / X",
      "url": "https://x.com/tech_speaker/status/1829381928391",
      "source": "x",
      "imageUrl": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
      "thumbnailUrl": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
      "description": "Keynote speech portrait release.",
      "publishedAt": null,
      "resultType": "social_media",
      "metadata": {}
    }
  ]
}
```

---

## 5. Environment Configuration (`.env`)

Add your SerpApi API key to your local `.env` file:

```env
# Visual Search Configuration
SEARCH_PROVIDER=serpapi
SEARCH_API_KEY=your_serpapi_api_key_here
SEARCH_API_URL=https://serpapi.com/search.json
SEARCH_MAX_RESULTS=10
SEARCH_TIMEOUT_MS=15000
```

> [!NOTE]
> For offline automated testing and development without an API key, you can set `SEARCH_PROVIDER=mock` or supply `?provider=mock` in query parameters.

---

## 6. Known Limitations & Rate Limits

*   **Free Tier Limit**: SerpApi accounts provide 100 free monthly searches. Rate-limit errors (HTTP 429) are caught and returned as `SEARCH_RATE_LIMITED`.
*   **Timeout Guard**: Searches that exceed `SEARCH_TIMEOUT_MS` (default 15 seconds) are automatically aborted with HTTP 504 `SEARCH_PROVIDER_TIMEOUT`.
*   **Privacy Guard**: Uploaded images are processed strictly in RAM and never written to permanent disk storage.
