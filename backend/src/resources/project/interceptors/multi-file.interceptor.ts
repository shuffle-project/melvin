import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { mkdir } from 'fs/promises';
import { diskStorage } from 'multer';
import { join, parse } from 'path';
import { v4 } from 'uuid';
import { MEDIA_TEMP_DIR } from '../../../modules/path/path.service';
import { CustomValidationException } from '../../../utils/exceptions';

export const MultiFileInterceptor = FileFieldsInterceptor(
  [
    { name: 'videos', maxCount: 10 },
    { name: 'subtitles', maxCount: 10 },
  ],
  {
    storage: diskStorage({
      destination: async (req, file, callback) => {
        const path = join(MEDIA_TEMP_DIR, v4());
        await mkdir(path, { recursive: true });
        callback(null, path);
      },
      filename: (req, file, callback) => {
        const { ext } = parse(file.originalname);
        callback(null, `file${ext}`);
      },
    }),

    fileFilter: (req, file, callback) => {
      if (file.fieldname === 'videos') {
        if (file.mimetype.match(/audio|video/g)) {
          // accept all audio/video mimetypes (video/mp4, audio/mp3, ...)
          callback(null, true);
        } else {
          callback(
            new CustomValidationException([
              {
                property: 'file_video',
                value: file.mimetype,
                constraints: {
                  unsupported_file_type: `file type is not supported as video file: ${file.mimetype}`,
                },
              },
            ]),
            false,
          );
        }
      } else {
        if (['.vtt', '.srt'].some((o) => file.originalname.endsWith(o))) {
          // accept application/x-subrip and text/vtt
          callback(null, true);
        } else {
          callback(
            new CustomValidationException([
              {
                property: 'file_subtitles',
                value: file.mimetype,
                constraints: {
                  unsupported_file_type: `file type is not supported as subtitles file: ${file.mimetype}`,
                },
              },
            ]),
            false,
          );
        }
      }
    },
  },
);
