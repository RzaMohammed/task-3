import { EventEmitter } from 'events';
import { PipelineStages, PipelineStageStatus, PipelineStatus } from './pipeline.types';
import { logger } from '../../utils/logger';

export type PipelineStageName = keyof PipelineStages;

export interface StageEventPayload {
  pipelineId: string;
  stage: PipelineStageName;
  timestamp: string;
  status: PipelineStageStatus;
  progressPercent?: number;
  durationMs?: number;
  message?: string;
  details?: Record<string, unknown>;
}

export interface PipelineCompleteEventPayload {
  pipelineId: string;
  status: PipelineStatus;
  totalMs: number;
  timestamp: string;
}

export class PipelineEventEmitter extends EventEmitter {
  private eventHistory: Map<string, StageEventPayload[]> = new Map();
  private maxHistoryPerPipeline: number = 50;

  constructor() {
    super();
  }

  private recordEvent(payload: StageEventPayload): void {
    const list = this.eventHistory.get(payload.pipelineId) || [];
    list.push(payload);
    if (list.length > this.maxHistoryPerPipeline) {
      list.shift();
    }
    this.eventHistory.set(payload.pipelineId, list);
  }

  public emitStageStart(pipelineId: string, stage: PipelineStageName, details?: Record<string, unknown>): void {
    const payload: StageEventPayload = {
      pipelineId,
      stage,
      status: 'PROCESSING',
      timestamp: new Date().toISOString(),
      progressPercent: 0,
      details
    };
    this.recordEvent(payload);
    logger.info(`[PIPELINE_EVENT] ${pipelineId} stage '${stage}' started`);
    this.emit('stage:start', payload);
    this.emit(`pipeline:${pipelineId}:progress`, payload);
  }

  public emitStageProgress(
    pipelineId: string,
    stage: PipelineStageName,
    progressPercent: number,
    message?: string,
    details?: Record<string, unknown>
  ): void {
    const payload: StageEventPayload = {
      pipelineId,
      stage,
      status: 'PROCESSING',
      timestamp: new Date().toISOString(),
      progressPercent: Math.min(100, Math.max(0, progressPercent)),
      message,
      details
    };
    this.recordEvent(payload);
    this.emit('stage:progress', payload);
    this.emit(`pipeline:${pipelineId}:progress`, payload);
  }

  public emitStageComplete(
    pipelineId: string,
    stage: PipelineStageName,
    durationMs: number,
    details?: Record<string, unknown>
  ): void {
    const payload: StageEventPayload = {
      pipelineId,
      stage,
      status: 'COMPLETED',
      timestamp: new Date().toISOString(),
      progressPercent: 100,
      durationMs,
      details
    };
    this.recordEvent(payload);
    logger.info(`[PIPELINE_EVENT] ${pipelineId} stage '${stage}' completed in ${durationMs}ms`);
    this.emit('stage:complete', payload);
    this.emit(`pipeline:${pipelineId}:progress`, payload);
  }

  public emitStageError(
    pipelineId: string,
    stage: PipelineStageName,
    error: Error | string,
    durationMs?: number
  ): void {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const payload: StageEventPayload = {
      pipelineId,
      stage,
      status: 'FAILED',
      timestamp: new Date().toISOString(),
      durationMs,
      message: errorMessage
    };
    this.recordEvent(payload);
    logger.warn(`[PIPELINE_EVENT] ${pipelineId} stage '${stage}' failed: ${errorMessage}`);
    this.emit('stage:error', payload);
    this.emit(`pipeline:${pipelineId}:progress`, payload);
  }

  public emitPipelineComplete(
    pipelineId: string,
    status: PipelineStatus,
    totalMs: number
  ): void {
    const payload: PipelineCompleteEventPayload = {
      pipelineId,
      status,
      totalMs,
      timestamp: new Date().toISOString()
    };
    logger.info(`[PIPELINE_EVENT] ${pipelineId} pipeline finished with status: ${status} in ${totalMs}ms`);
    this.emit('pipeline:complete', payload);
    this.emit(`pipeline:${pipelineId}:complete`, payload);
  }

  public getHistory(pipelineId: string): StageEventPayload[] {
    return [...(this.eventHistory.get(pipelineId) || [])];
  }

  public clearHistory(pipelineId?: string): void {
    if (pipelineId) {
      this.eventHistory.delete(pipelineId);
    } else {
      this.eventHistory.clear();
    }
  }
}

export const pipelineEventEmitter = new PipelineEventEmitter();
