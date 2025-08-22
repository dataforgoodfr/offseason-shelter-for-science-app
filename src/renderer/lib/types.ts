export type InitStatus = 'loading' | 'success' | 'error';

export interface InitStep {
  id: string;
  label: string;
  status: InitStatus;
}