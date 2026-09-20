import { Request, Response } from 'express';
import { pipelineEventEmitter, StageEventPayload, PipelineCompleteEventPayload } from '../services/pipeline/pipeline.events';
import { logger } from '../utils/logger';

export class StreamController {
  public static streamPipelineEvents(req: Request, res: Response): void {
    const rawId = req.params.pipelineId;
    const pipelineId = typeof rawId === 'string' ? rawId.trim() : '';

    if (!pipelineId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PIPELINE_ID',
          message: 'A valid pipelineId parameter is required to stream events.'
        }
      });
      return;
    }

    // Set Server-Sent Events headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    if (typeof (res as any).flushHeaders === 'function') {
      (res as any).flushHeaders();
    }

    logger.info(`[STREAM] Client connected to SSE stream for pipeline: ${pipelineId}`);

    // Helper to send formatted SSE message
    const sendEvent = (event: string, data: unknown) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    // Initial connection confirmation
    sendEvent('connected', {
      pipelineId,
      status: 'CONNECTED',
      timestamp: new Date().toISOString()
    });

    // Replay past stage history if available
    const history = pipelineEventEmitter.getHistory(pipelineId);
    if (history.length > 0) {
      for (const item of history) {
        sendEvent('stage:replay', item);
      }
    }

    // Event listeners
    const onProgress = (payload: StageEventPayload) => {
      sendEvent('stage:progress', payload);
    };

    const onComplete = (payload: PipelineCompleteEventPayload) => {
      sendEvent('pipeline:complete', payload);
    };

    const progressEventKey = `pipeline:${pipelineId}:progress`;
    const completeEventKey = `pipeline:${pipelineId}:complete`;

    pipelineEventEmitter.on(progressEventKey, onProgress);
    pipelineEventEmitter.on(completeEventKey, onComplete);

    // Keepalive ping every 15 seconds
    const pingInterval = setInterval(() => {
      res.write(': ping\n\n');
    }, 15_000);

    // Clean up when client disconnects
    req.on('close', () => {
      clearInterval(pingInterval);
      pipelineEventEmitter.off(progressEventKey, onProgress);
      pipelineEventEmitter.off(completeEventKey, onComplete);
      logger.info(`[STREAM] Client disconnected from SSE stream for pipeline: ${pipelineId}`);
    });
  }
}
