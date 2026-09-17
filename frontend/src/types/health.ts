export type ServiceHealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'ok';

export interface ServiceCheck {
  status: ServiceHealthStatus;
  latency_ms?: number;
  message?: string;
  endpoint?: string;
  cluster?: string;
  [key: string]: any;
}

export interface DeepHealthResponse {
  service: string;
  status: ServiceHealthStatus;
  timestamp: string;
  checks: {
    ai_service: ServiceCheck;
    solana_rpc: ServiceCheck;
    [key: string]: ServiceCheck;
  };
}

export interface BlockchainHealthResponse {
  success: boolean;
  status: 'connected' | 'error';
  cluster?: string;
  endpoint?: string;
  slot?: number;
  version?: string;
  error?: string;
}

export interface BasicHealthResponse {
  service: string;
  status: string;
  version?: string;
  uptime?: number;
  timestamp?: string;
}
