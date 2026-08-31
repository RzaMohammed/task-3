const request = require('supertest');
import app from '../backend/src/server';
import { SearchFactory } from '../backend/src/services/search/search.factory';
import { getSourcePlatform } from '../backend/src/utils/platform';

describe('Module 3 — Visual Web Search Test Suite', () => {
  const mockProvider = SearchFactory.getMockProvider();

  beforeEach(() => {
    mockProvider.behavior = 'success';
  });

  test('Test 1 — Image search returns normalized results & classifies platforms', async () => {
    const dummyImageBuffer = Buffer.from('fake-image-bytes-jpeg-content');

    const res = await request(app)
      .post('/api/search/image?provider=mock')
      .attach('image', dummyImageBuffer, 'sample.jpg');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.query_type).toBe('visual_image_search');
    expect(res.body.result_count).toBeGreaterThan(0);
    expect(Array.isArray(res.body.results)).toBe(true);

    const firstResult = res.body.results[0];
    expect(firstResult).toHaveProperty('id');
    expect(firstResult).toHaveProperty('title');
    expect(firstResult).toHaveProperty('url');
    expect(firstResult).toHaveProperty('source');
    expect(firstResult).toHaveProperty('resultType');
    expect(firstResult).toHaveProperty('metadata');
    expect(firstResult.url).toMatch(/^https?:\/\//);

    // Verify social media detection
    const instagramResult = res.body.results.find((r: any) => r.source.toLowerCase() === 'instagram');
    if (instagramResult) {
      expect(instagramResult.resultType).toBe('social_media');
    }
  });

  test('Test 2 — Missing image upload returns MISSING_IMAGE', async () => {
    const res = await request(app)
      .post('/api/search/image?provider=mock');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('MISSING_IMAGE');
  });

  test('Test 3 — Empty 0-byte file returns INVALID_IMAGE', async () => {
    const res = await request(app)
      .post('/api/search/image?provider=mock')
      .attach('image', Buffer.alloc(0), 'empty.jpg');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_IMAGE');
  });

  test('Test 4 — Provider authentication failure returns SEARCH_AUTHENTICATION_FAILED', async () => {
    mockProvider.behavior = 'auth_error';
    const dummyImageBuffer = Buffer.from('test-image-bytes');

    const res = await request(app)
      .post('/api/search/image?provider=mock')
      .attach('image', dummyImageBuffer, 'test.jpg');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('SEARCH_AUTHENTICATION_FAILED');
  });

  test('Test 5 — Provider timeout returns SEARCH_PROVIDER_TIMEOUT', async () => {
    mockProvider.behavior = 'timeout';
    const dummyImageBuffer = Buffer.from('test-image-bytes');

    const res = await request(app)
      .post('/api/search/image?provider=mock')
      .attach('image', dummyImageBuffer, 'test.jpg');

    expect(res.status).toBe(504);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('SEARCH_PROVIDER_TIMEOUT');
  });

  test('Test 6 — Empty search results returns NO_SEARCH_RESULTS', async () => {
    mockProvider.behavior = 'empty';
    const dummyImageBuffer = Buffer.from('test-image-bytes');

    const res = await request(app)
      .post('/api/search/image?provider=mock')
      .attach('image', dummyImageBuffer, 'test.jpg');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NO_SEARCH_RESULTS');
  });

  test('Unit Test — getSourcePlatform classifies known social domains correctly', () => {
    expect(getSourcePlatform('https://www.instagram.com/p/C9xZ/')).toEqual({
      source: 'instagram',
      resultType: 'social_media'
    });

    expect(getSourcePlatform('https://x.com/user/status/123')).toEqual({
      source: 'x',
      resultType: 'social_media'
    });

    expect(getSourcePlatform('https://www.facebook.com/photo.php')).toEqual({
      source: 'facebook',
      resultType: 'social_media'
    });

    expect(getSourcePlatform('https://en.wikipedia.org/wiki/Face')).toEqual({
      source: 'en.wikipedia.org',
      resultType: 'web_page'
    });

    expect(getSourcePlatform('https://cdn.example.com/images/portrait.png')).toEqual({
      source: 'cdn.example.com',
      resultType: 'image'
    });
  });
});
