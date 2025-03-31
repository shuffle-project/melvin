import { Injectable } from '@angular/core';
import { lastValueFrom, retry, timer } from 'rxjs';
import { ApiService } from '../api/api.service';

@Injectable({
  providedIn: 'root',
})
export class UploadService {
  CHUNKSIZE = 20; // in MB

  constructor(private api: ApiService) {}

  async upload(file: File) {
    const createMediaEntity = await lastValueFrom(
      this.api.createMediaFile(file.name, file.size)
    );
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
      await lastValueFrom(
        this.api.updateMediaFile(createMediaEntity.id, chunk).pipe(
          retry({
            count: 5,
            delay: (error, count) => {
              console.log(error);
              console.log('timer', Math.min(60000, Math.pow(2, count) * 1000));
              return timer(Math.min(60000, Math.pow(2, count) * 1000));
            },
          })
        )
      );

      from = to;
      to = Math.min(to + chunksize, file.size);
    }

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
