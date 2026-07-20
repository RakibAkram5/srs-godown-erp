import { api, unwrap } from './api';

export interface HealthStatus {
  status: string;
  database: string;
  uptime: number;
  timestamp: string;
}

export const healthService = {
  check(): Promise<HealthStatus> {
    return unwrap<HealthStatus>(api.get('/health'));
  },
};
