import { BehaviorSubject, lastValueFrom, retry, timer } from 'rxjs';
import { ApiService } from '../api/api.service';
import { CreateMediaEntity } from '../api/entities/upload-file.entity';
import { UploadProgress } from './upload.interfaces';

export class UploadHandler {
  public progress$: BehaviorSubject<UploadProgress>;
  CHUNKSIZE = 20; // in MB

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
    const progressData: UploadProgress = {
      uploadId: null,
      status: 'uploading',
      value: 0,
      bytesSent: 0,
      bytesTotal: this.file.size,
      starttime: Date.now(),
      eta: 0,
    };
    this.progress$.next(progressData);
    let createMediaEntity: CreateMediaEntity;
    try {
      createMediaEntity = await lastValueFrom(
        this.api.createMediaFile({
          filename: this.file.name,
          filesize: this.file.size,
          mimetype: this.file.type,
        })
      );
      this.progress$.next({
        ...this.progress$.value,
        uploadId: createMediaEntity.id,
      });
    } catch (error) {
      this.progress$.next({
        ...progressData,
        status: 'failed',
        error: 'failed to create upload', // TODO
      });
      throw error;
    }
    console.log(this.file);
    console.log(createMediaEntity);

    const chunksize = this.CHUNKSIZE * 1000 * 1000; // 4mb
    let from = 0;
    let to = Math.min(chunksize, this.file.size);

    console.log('file.size: ' + this.file.size);
    while (from < this.file.size) {
      const chunk = this.file.slice(from, to);
      console.log('from: ' + from + ' to: ' + to);

      // TODO retry backoff
      // if failes -> retry -> fail again -> retry after 5 seconods
      try {
        await lastValueFrom(
          this.api.updateMediaFile(createMediaEntity.id, chunk).pipe(
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
          ...progressData,
          status: 'failed',
          error: 'failed to upload', // TODO
        });
        throw error;
      }

      from = to;
      to = Math.min(to + chunksize, this.file.size);
    }

    this.progress$.next({
      ...progressData,
      status: 'completed',
      eta: 0,
    });
  }
}
