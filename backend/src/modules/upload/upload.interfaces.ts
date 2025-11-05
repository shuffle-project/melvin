export interface CreateUploadDto {
  filesize: number;
  filename: string;
  mimetype: string;
}

export interface UploadMetadata extends CreateUploadDto {
  uploadId: string;
  createdBy: string;
  extension: string;
  mimetype: string;
}

export interface UploadEntity {
  id: string;
}
