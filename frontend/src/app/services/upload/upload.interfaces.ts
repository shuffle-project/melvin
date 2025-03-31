export interface UploadProgress {
  status: 'uploading' | 'completed' | 'failed';
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
