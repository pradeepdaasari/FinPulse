export interface HealthMetric {
  id: number;
  metricType: string;
  value: number;
  unit: string;
  measuredAt: string;
  notes?: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface HealthMetricTrend {
  measuredAt: string;
  value: number;
  unit: string;
}
