export interface UploadProgress {
  uploadId: string | null;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  value: number;
  bytesSent: number;
  bytesTotal: number;
  starttime: number;
  eta: number;

  error?: string;
}

export interface CreateMediaFileDto {
  filesize: number;
  filename: string;
  mimetype: string;
}
