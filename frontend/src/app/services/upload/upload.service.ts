import { Injectable } from '@angular/core';
import { lastValueFrom, retry, Subject, timer } from 'rxjs';
import { ApiService } from '../api/api.service';
import { CreateMediaEntity } from '../api/entities/upload-file.entity';
import { UploadProgress } from './upload.interfaces';

@Injectable({
  providedIn: 'root',
})
export class UploadService {
  CHUNKSIZE = 20; // in MB

  constructor(private api: ApiService) {}

  async upload(file: File, progress: Subject<UploadProgress>) {
    const progressData: UploadProgress = {
      status: 'uploading',
      progress: 0,
      bytesSent: 0,
      bytesTotal: file.size,
      starttime: Date.now(),
      eta: 0,
    };
    progress.next(progressData);
    let createMediaEntity: CreateMediaEntity;
    try {
      createMediaEntity = await lastValueFrom(
        this.api.createMediaFile(file.name, file.size)
      );
    } catch (error) {
      progress.next({
        ...progressData,
        status: 'failed',
        error: 'failed to create upload', // TODO
      });
      throw error;
    }
    console.log(file);
    console.log(createMediaEntity);

    const chunksize = this.CHUNKSIZE * 1000 * 1000; // 4mb
    let from = 0;
    let to = Math.min(chunksize, file.size);

    console.log('file.size: ' + file.size);
    while (from < file.size) {
      const chunk = file.slice(from, to);
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
        progressData.progress = progressData.bytesSent / file.size;

        const timeElapsedInSeconds =
          (Date.now() - progressData.starttime) / 1000;
        const uploadSpeedInSeconds =
          progressData.bytesSent / timeElapsedInSeconds;

        progressData.eta =
          (progressData.bytesTotal - progressData.bytesSent) /
          uploadSpeedInSeconds;

        progress.next(progressData);
      } catch (error) {
        progress.next({
          ...progressData,
          status: 'failed',
          error: 'failed to upload', // TODO
        });
        throw error;
      }

      from = to;
      to = Math.min(to + chunksize, file.size);
    }

    progress.next({
      ...progressData,
      status: 'completed',
      eta: 0,
    });
    return { id: createMediaEntity.id };
  }

  // Observable<{progress:0, bytesSent: 0, bytesTotal:1231241, starttime:x, eta:x}>
}

// import { Observable, throwError } from 'rxjs';
// import { finalize, mergeMap } from 'rxjs/operators';

// export const genericRetryStrategy =
//   ({
//     maxRetryAttempts = 3,
//     scalingDuration = 1000,
//     excludedStatusCodes = [],
//   }: {
//     maxRetryAttempts?: number;
//     scalingDuration?: number;
//     excludedStatusCodes?: number[];
//   } = {}) =>
//   (attempts: Observable<any>) => {
//     return attempts.pipe(
//       mergeMap((error, i) => {
//         const retryAttempt = i + 1;
//         // if maximum number of retries have been met
//         // or response is a status code we don't wish to retry, throw error
//         if (
//           retryAttempt > maxRetryAttempts ||
//           excludedStatusCodes.find((e) => e === error.status)
//         ) {
//           return throwError(error);
//         }
//         console.log(
//           `Attempt ${retryAttempt}: retrying in ${
//             retryAttempt * scalingDuration
//           }ms`
//         );
//         // retry after 1s, 2s, etc...
//         return timer(retryAttempt * scalingDuration);
//       }),
//       finalize(() => console.log('We are done!'))
//     );
//   };
