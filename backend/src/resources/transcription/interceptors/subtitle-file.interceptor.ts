import { FileInterceptor } from '@nestjs/platform-express';
import { mkdir } from 'fs/promises';
import { diskStorage } from 'multer';
import { join } from 'path';
import { v4 } from 'uuid';
import { MEDIA_TEMP_DIR } from '../../../modules/path/path.service';
import { CustomValidationException } from '../../../utils/exceptions';

export const SubtitleFileInterceptor = FileInterceptor('file', {
  storage: diskStorage({
    destination: async (req, file, callback) => {
      const path = join(MEDIA_TEMP_DIR, v4());
      await mkdir(path, { recursive: true });
      callback(null, path);
    },
    filename: (req, file, callback) => {
      callback(null, file.originalname);
    },
  }),
  fileFilter: (req, file, callback) => {
    if (['.vtt', '.srt', '.json'].some((o) => file.originalname.endsWith(o))) {
      // accept application/x-subrip and text/vtt
      callback(null, true);
    } else {
      callback(
        new CustomValidationException([
          {
            property: 'file',
            value: file.mimetype,
            constraints: {
              unsupported_file_type: `file type is not supported as subtitles file: ${file.mimetype}`,
            },
          },
        ]),
        false,
      );
    }
  },
});
