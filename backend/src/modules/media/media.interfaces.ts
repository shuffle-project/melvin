export interface CreateMediaFileDto {
  filesize: number;
  filename: string;
  mimetype: string;
}

export interface MediaFileMetadata extends CreateMediaFileDto {
  uploadId: string;
  createdBy: string;
  extension: string;
  mimetype: string;
  // createdAt: string;
  // modifiedAt: string;
}

export interface CreateMediaEntity {
  id: string;
}
