// src/types/index.ts
export interface Dataset {
  id: string;
  name: string;
  size: number;
  description?: string;
  downloadUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface DownloadProgress {
  downloadedBytes: number;
  totalBytes: number;
  percentage: number;
  speed?: number; // bytes per second
}

export interface DownloadResult {
  dataset: Dataset;
  localPath: string;
  success: boolean;
  error?: string;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}
