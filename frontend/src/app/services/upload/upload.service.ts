import { Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';
import { UploadHandler } from './upload-handler';

@Injectable({
  providedIn: 'root',
})
export class UploadService {
  constructor(private api: ApiService) {}

  createUpload(file: File): UploadHandler {
    return new UploadHandler(file, this.api);
  }
}
