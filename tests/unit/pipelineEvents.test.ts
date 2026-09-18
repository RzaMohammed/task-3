import { PipelineEventEmitter, StageEventPayload } from '../../backend/src/services/pipeline/pipeline.events';

describe('PipelineEventEmitter Unit Test Suite', () => {
  let emitter: PipelineEventEmitter;

  beforeEach(() => {
    emitter = new PipelineEventEmitter();
  });

  test('emits stage:start and records event in history', (done) => {
    const pipelineId = 'pipe-test-101';

    emitter.on('stage:start', (payload: StageEventPayload) => {
      expect(payload.pipelineId).toBe(pipelineId);
      expect(payload.stage).toBe('faceAnalysis');
      expect(payload.status).toBe('PROCESSING');
      expect(payload.progressPercent).toBe(0);
      expect(payload.timestamp).toBeDefined();

      const history = emitter.getHistory(pipelineId);
      expect(history.length).toBe(1);
      expect(history[0].stage).toBe('faceAnalysis');
      done();
    });

    emitter.emitStageStart(pipelineId, 'faceAnalysis');
  });

  test('emits stage:progress with bounded percentage and message', (done) => {
    const pipelineId = 'pipe-test-102';

    emitter.on('stage:progress', (payload: StageEventPayload) => {
      expect(payload.pipelineId).toBe(pipelineId);
      expect(payload.stage).toBe('webSearch');
      expect(payload.progressPercent).toBe(65);
      expect(payload.message).toBe('Filtering candidate images');
      done();
    });

    emitter.emitStageProgress(pipelineId, 'webSearch', 65, 'Filtering candidate images');
  });

  test('emits stage:complete with duration and COMPLETED status', (done) => {
    const pipelineId = 'pipe-test-103';

    emitter.on('stage:complete', (payload: StageEventPayload) => {
      expect(payload.pipelineId).toBe(pipelineId);
      expect(payload.stage).toBe('matching');
      expect(payload.status).toBe('COMPLETED');
      expect(payload.durationMs).toBe(142);
      expect(payload.details?.matchesFound).toBe(2);
      done();
    });

    emitter.emitStageComplete(pipelineId, 'matching', 142, { matchesFound: 2 });
  });

  test('emits stage:error with formatted error message', (done) => {
    const pipelineId = 'pipe-test-104';

    emitter.on('stage:error', (payload: StageEventPayload) => {
      expect(payload.pipelineId).toBe(pipelineId);
      expect(payload.stage).toBe('blockchain');
      expect(payload.status).toBe('FAILED');
      expect(payload.message).toBe('RPC endpoint timed out');
      done();
    });

    emitter.emitStageError(pipelineId, 'blockchain', new Error('RPC endpoint timed out'), 3000);
  });

  test('emits pipeline:complete event with overall metrics', (done) => {
    const pipelineId = 'pipe-test-105';

    emitter.on('pipeline:complete', (payload) => {
      expect(payload.pipelineId).toBe(pipelineId);
      expect(payload.status).toBe('VERIFIED');
      expect(payload.totalMs).toBe(850);
      done();
    });

    emitter.emitPipelineComplete(pipelineId, 'VERIFIED', 850);
  });

  test('clears history correctly for specific pipeline or globally', () => {
    emitter.emitStageStart('pipe-a', 'faceAnalysis');
    emitter.emitStageStart('pipe-b', 'faceAnalysis');

    expect(emitter.getHistory('pipe-a').length).toBe(1);
    expect(emitter.getHistory('pipe-b').length).toBe(1);

    emitter.clearHistory('pipe-a');
    expect(emitter.getHistory('pipe-a').length).toBe(0);
    expect(emitter.getHistory('pipe-b').length).toBe(1);

    emitter.clearHistory();
    expect(emitter.getHistory('pipe-b').length).toBe(0);
  });
});
