export interface BloodWorkReport {
  id: number;
  reportDate: string;
  labName?: string;
  notes?: string;
  results: BloodWorkResult[];
  createdAt?: string;
  updatedAt?: string;
}

export interface BloodWorkReportSummary {
  id: number;
  reportDate: string;
  labName?: string;
  notes?: string;
  resultCount: number;
  abnormalCount: number;
  createdAt?: string;
}

export interface BloodWorkResult {
  id?: number;
  reportId?: number;
  testName: string;
  value: number;
  unit: string;
  referenceMin?: number;
  referenceMax?: number;
}

export interface TestHistory {
  date: string;
  value: number;
  unit: string;
  referenceMin?: number;
  referenceMax?: number;
}
