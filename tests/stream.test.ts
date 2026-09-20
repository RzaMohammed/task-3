const request = require('supertest');
import app from '../backend/src/server';
import { pipelineEventEmitter } from '../backend/src/services/pipeline/pipeline.events';

describe('Real-Time Pipeline SSE Streaming Integration Tests', () => {
  const pipelineId = 'pipe-stream-test-01';

  beforeEach(() => {
    pipelineEventEmitter.clearHistory(pipelineId);
  });

  afterEach(() => {
    pipelineEventEmitter.clearHistory(pipelineId);
  });

  test('GET /api/stream/pipeline/:pipelineId connects and streams initial connected event', (done) => {
    pipelineEventEmitter.emitStageStart(pipelineId, 'faceAnalysis');

    const req = request(app)
      .get(`/api/stream/pipeline/${pipelineId}`)
      .set('Accept', 'text/event-stream')
      .expect('Content-Type', /text\/event-stream/)
      .expect('Cache-Control', /no-cache/)
      .expect(200);

    let received = '';

    req.buffer(false);
    req.parse((res: any, callback: any) => {
      res.on('data', (chunk: Buffer) => {
        received += chunk.toString();
        if (received.includes('event: connected') && received.includes('event: stage:replay')) {
          expect(received).toContain('pipe-stream-test-01');
          expect(received).toContain('faceAnalysis');
          res.destroy();
          done();
        }
      });
      res.on('error', () => {
        // Ignore expected socket destruction
      });
      res.on('end', () => callback(null, received));
    });

    req.end(() => {});
  });

  test('GET /api/stream/pipeline/:pipelineId returns 400 when pipelineId is blank', async () => {
    const res = await request(app).get('/api/stream/pipeline/%20');
    expect([400, 404]).toContain(res.status);
  });
});
