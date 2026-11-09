import { HTTPMethod } from './collection';

export type PerformanceProfile = 'SMOKE' | 'LOAD' | 'STRESS' | 'SPIKE';

export interface PerformanceScenario {
  id: string;
  projectId: string;
  name: string;
  collectionId?: string;
  collectionName?: string;
  requestId?: string;
  method: HTTPMethod;
  url: string;
  body?: string;
  profile: PerformanceProfile;
  targetVUs: number;
  duration: string; // e.g. "30s", "1m", "2m"
  p95Threshold: number; // in ms
  createdAt: string;
}

export interface PerformanceMetricPoint {
  time: string;
  vus: number;
  rps: number;
  p95: number;
  errorRate: number;
}

export interface PerformanceReport {
  id: string;
  projectId: string;
  scenarioId: string;
  scenarioName: string;
  endpointMethod: HTTPMethod;
  endpointUrl: string;
  profile: PerformanceProfile;
  targetVUs: number;
  duration: string;
  p95Threshold: number;
  totalRequests: number;
  peakRps: number;
  avgRps: number;
  p95Latency: number;
  p50Latency: number;
  errorRate: number;
  verdict: 'PASSED' | 'BREACH';
  timestamp: string;
  logs: string[];
  metrics: PerformanceMetricPoint[];
}
