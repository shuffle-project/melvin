import {
  BehaviorSubject,
  lastValueFrom,
  retry,
  Subject,
  takeUntil,
  timer,
} from 'rxjs';
import { ApiService } from '../api/api.service';
import { UploadEntity } from '../api/entities/upload-file.entity';
import { UploadProgress } from './upload.interfaces';

export class UploadHandler {
  public cancel$$ = new Subject<void>();
  public progress$: BehaviorSubject<UploadProgress>;
  MAX_CHUNKSIZE = 20; // in MB

  constructor(public file: File, private api: ApiService) {
    this.progress$ = new BehaviorSubject<UploadProgress>({
      uploadId: null,
      status: 'pending',
      value: 0,
      bytesSent: 0,
      bytesTotal: file.size,
      starttime: 0,
      eta: 0,
    });
  }

  async start() {
    // start upload#
    this.progress$.next({
      ...this.progress$.value,
      status: 'uploading',
      starttime: Date.now(),
    });
    let uploadEntity: UploadEntity;
    try {
      uploadEntity = await lastValueFrom(
        this.api.createUpload({
          filename: this.file.name,
          filesize: this.file.size,
          mimetype: this.file.type,
        })
      );
      this.progress$.next({
        ...this.progress$.value,
        uploadId: uploadEntity.id,
      });
    } catch (error) {
      this.progress$.next({
        ...this.progress$.value,
        status: 'failed',
        error: 'failed to create upload', // TODO
      });
      throw error;
    }
    console.log(this.file);
    console.log(uploadEntity);

    let index = 1;
    const maxChunksize = this.MAX_CHUNKSIZE * 1000 * 1000;
    let currentChunksize = 2 * 1000 * 1000; // 2MB
    let from = 0;
    let to = Math.min(currentChunksize, this.file.size);

    console.log('file.size: ' + this.file.size);
    while (from < this.file.size) {
      const chunk = this.file.slice(from, to);
      console.log('from: ' + from + ' to: ' + to);

      // TODO retry backoff
      // if failes -> retry -> fail again -> retry after 5 seconods
      try {
        await lastValueFrom(
          this.api.updateUpload(uploadEntity.id, chunk).pipe(
            takeUntil(this.cancel$$),
            retry({
              count: 5,
              delay: (error, count) => {
                console.log(error);
                console.log(
                  'timer',
                  Math.min(60000, Math.pow(2, count) * 1000)
                );
                return timer(Math.min(60000, Math.pow(2, count) * 1000));
              },
            })
          )
        );

        const progressData = { ...this.progress$.value };

        progressData.bytesSent += chunk.size;
        progressData.value = progressData.bytesSent / this.file.size;

        const timeElapsedInSeconds =
          (Date.now() - progressData.starttime) / 1000;
        const uploadSpeedInSeconds =
          progressData.bytesSent / timeElapsedInSeconds;

        progressData.eta =
          (progressData.bytesTotal - progressData.bytesSent) /
          uploadSpeedInSeconds;

        this.progress$.next(progressData);
      } catch (error) {
        this.progress$.next({
          ...this.progress$.value,
          status: 'failed',
          error: 'failed to upload', // TODO
        });
        throw error;
      }

      from = to;

      // set currentChunksize to 2,4,8,16,20,20,20,... MB
      currentChunksize = currentChunksize * 2;
      if (currentChunksize > maxChunksize) currentChunksize = maxChunksize;

      to = Math.min(to + currentChunksize, this.file.size);
      index++;
    }

    this.progress$.next({
      ...this.progress$.value,
      status: 'completed',
      eta: 0,
    });
  }
}
