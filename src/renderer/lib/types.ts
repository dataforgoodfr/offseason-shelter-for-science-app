export type InitStatus = 'loading' | 'success' | 'error';

export interface InitStep {
  id: string;
  label: string;
  status: InitStatus;
}

export interface DispatchRequestPayload {
  name: string
  description: string
  free_space_gb: number
  node_id: string
  rescuer_id: number
}

export interface Asset {
  asset_id: string
  ds_id: string
  name: string
  path: string
  priority: number
  res_id: string
  size_mb: number
  url: string
  magnet?: string
  status?: 'SUCCESS' | 'ABORTED' | 'DOWNLOADING'
}

export interface DispatchResponse {
  asset: Asset[]
  message: string
  received_data: {
    description: string
    free_space_gb: number
    name: string
    node_id: string
  }
  status: string
}

export interface StatusUpdatePayload {
  rescuer_id: number
  message: string
  assets: Asset[]
}

export interface DownloadProgressCallback {
  onProgress?: (progress: number, currentFileIndex: number, totalFiles: number) => void
  onStatusChange?: (status: 'downloading now' | 'uploading') => void
  onFileComplete?: (asset: Asset, magnetLink?: string) => void
  onComplete?: (completedAssets: Asset[]) => void
  onError?: (error: string, asset?: Asset) => void
}