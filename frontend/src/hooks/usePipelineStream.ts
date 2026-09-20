import { useState, useEffect, useRef, useCallback } from 'react';
import { apiService } from '../services/api';
import {
  PipelineStages,
  StageEventPayload,
  PipelineStreamEvent
} from '../types/pipeline';

export interface UsePipelineStreamOptions {
  enabled?: boolean;
  onEvent?: (event: PipelineStreamEvent) => void;
  onStageProgress?: (payload: StageEventPayload) => void;
  onComplete?: (result: any) => void;
  onError?: (err: Event | Error) => void;
}

export interface UsePipelineStreamReturn {
  isConnected: boolean;
  stages: PipelineStages;
  currentStage: keyof PipelineStages | null;
  overallProgress: number;
  events: PipelineStreamEvent[];
  lastError: string | null;
  finalResult: any | null;
  reconnect: () => void;
  close: () => void;
}

const initialStages: PipelineStages = {
  faceAnalysis: 'PENDING',
  webSearch: 'PENDING',
  matching: 'PENDING',
  evidence: 'PENDING',
  blockchain: 'PENDING',
  verification: 'PENDING'
};

/**
 * React hook connecting to the real-time Server-Sent Events (SSE) pipeline stream endpoint.
 * Automatically handles connection lifecycle, stage progress transitions, and cleanup.
 */
export function usePipelineStream(
  pipelineId: string | null | undefined,
  options: UsePipelineStreamOptions = {}
): UsePipelineStreamReturn {
  const { enabled = true, onEvent, onStageProgress, onComplete, onError } = options;

  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [stages, setStages] = useState<PipelineStages>(initialStages);
  const [currentStage, setCurrentStage] = useState<keyof PipelineStages | null>(null);
  const [overallProgress, setOverallProgress] = useState<number>(0);
  const [events, setEvents] = useState<PipelineStreamEvent[]>([]);
  const [lastError, setLastError] = useState<string | null>(null);
  const [finalResult, setFinalResult] = useState<any | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);

  const close = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    }
  }, []);

  const connect = useCallback(() => {
    if (!pipelineId || !enabled) return;

    // Close existing connection if active
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    const streamUrl = apiService.getPipelineStreamUrl(pipelineId);
    const es = new EventSource(streamUrl);
    eventSourceRef.current = es;

    es.addEventListener('open', () => {
      setIsConnected(true);
      setLastError(null);
    });

    es.addEventListener('connected', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        const streamEvent: PipelineStreamEvent = { event: 'connected', data };
        setEvents((prev) => [...prev, streamEvent]);
        onEvent?.(streamEvent);
      } catch {
        // safe ignore
      }
    });

    const handleStageUpdate = (data: StageEventPayload, eventName: string) => {
      if (!data || !data.stage) return;
      setCurrentStage(data.stage);
      setStages((prev) => ({
        ...prev,
        [data.stage]: data.status
      }));

      // Calculate approximate progress across 6 stages
      const stageKeys: (keyof PipelineStages)[] = [
        'faceAnalysis',
        'webSearch',
        'matching',
        'evidence',
        'blockchain',
        'verification'
      ];
      const stageIndex = stageKeys.indexOf(data.stage);
      if (stageIndex >= 0) {
        const basePercent = (stageIndex / stageKeys.length) * 100;
        const currentStageFactor = (data.progressPercent || 0) / stageKeys.length;
        setOverallProgress(Math.min(100, Math.round(basePercent + currentStageFactor)));
      }

      const streamEvent: PipelineStreamEvent = { event: eventName, data };
      setEvents((prev) => [...prev, streamEvent]);
      onEvent?.(streamEvent);
      onStageProgress?.(data);
    };

    es.addEventListener('stage:progress', (e: MessageEvent) => {
      try {
        const data: StageEventPayload = JSON.parse(e.data);
        handleStageUpdate(data, 'stage:progress');
      } catch {
        // safe ignore
      }
    });

    es.addEventListener('stage:replay', (e: MessageEvent) => {
      try {
        const data: StageEventPayload = JSON.parse(e.data);
        handleStageUpdate(data, 'stage:replay');
      } catch {
        // safe ignore
      }
    });

    es.addEventListener('pipeline:complete', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        setFinalResult(data);
        setOverallProgress(100);
        const streamEvent: PipelineStreamEvent = { event: 'pipeline:complete', data };
        setEvents((prev) => [...prev, streamEvent]);
        onEvent?.(streamEvent);
        onComplete?.(data);
        es.close();
        setIsConnected(false);
      } catch {
        // safe ignore
      }
    });

    es.addEventListener('error', (err: Event) => {
      setIsConnected(false);
      setLastError('SSE connection error or closed by server.');
      onError?.(err);
    });
  }, [pipelineId, enabled, onEvent, onStageProgress, onComplete, onError]);

  useEffect(() => {
    if (pipelineId && enabled) {
      connect();
    }
    return () => {
      close();
    };
  }, [pipelineId, enabled, connect, close]);

  const reconnect = useCallback(() => {
    setStages(initialStages);
    setOverallProgress(0);
    setEvents([]);
    setFinalResult(null);
    setLastError(null);
    connect();
  }, [connect]);

  return {
    isConnected,
    stages,
    currentStage,
    overallProgress,
    events,
    lastError,
    finalResult,
    reconnect,
    close
  };
}
