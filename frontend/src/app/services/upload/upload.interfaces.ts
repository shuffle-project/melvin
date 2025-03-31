export interface UploadProgress {
  status: 'uploading' | 'completed' | 'failed';
  progress: number;
  bytesSent: number;
  bytesTotal: number;
  starttime: number;
  eta: number;

  error?: string;
}
