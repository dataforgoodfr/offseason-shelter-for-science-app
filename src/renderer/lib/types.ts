import { Asset } from 'shared/api'

export type InitStatus = 'loading' | 'success' | 'error';

export interface InitStep {
  id: string;
  label: string;
  status: InitStatus;
}

export interface DispatchRequestPayload {
  name: string
  description: string
  free_space: number
  node_id: string // broija 2025/09/04 : should probably be a number, named rescuer_id
}

export interface DispatchResponse {
  asset: Asset[]
  message: string
  received_data: {
    description: string
    free_space: number
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