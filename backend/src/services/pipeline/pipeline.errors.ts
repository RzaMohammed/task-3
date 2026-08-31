import { PipelineStatus, PipelineStages } from './pipeline.types';

export class PipelineError extends Error {
  public readonly status: PipelineStatus;
  public readonly failedStage: keyof PipelineStages;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(
    statusCode: number,
    status: PipelineStatus,
    failedStage: keyof PipelineStages,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'PipelineError';
    this.statusCode = statusCode;
    this.status = status;
    this.failedStage = failedStage;
    this.details = details;
    Object.setPrototypeOf(this, PipelineError.prototype);
  }
}
