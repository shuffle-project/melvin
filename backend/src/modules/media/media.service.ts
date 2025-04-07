import { Injectable } from '@nestjs/common';
import { ReadStream, createReadStream } from 'fs';
import { appendFile, stat, writeFile } from 'fs/promises';
import { DbService } from 'src/modules/db/db.service';
import { CustomLogger } from 'src/modules/logger/logger.service';
import { PathService } from 'src/modules/path/path.service';
import { CustomBadRequestException } from 'src/utils/exceptions';

import { Request, Response } from 'express';
import { ensureDir, exists, readJson, writeJSON } from 'fs-extra';
import { extname, join } from 'path';
import { AuthUser } from 'src/resources/auth/auth.interfaces';
import { v4 } from 'uuid';
import {
  CreateMediaEntity,
  CreateMediaFileDto,
  MediaFileMetadata,
} from './media.interfaces';

@Injectable()
export class MediaService {
  constructor(
    private readonly pathService: PathService,
    private logger: CustomLogger,
    private db: DbService,
  ) {
    this.logger.setContext(this.constructor.name);
  }

  async getMediaChunk(
    viewerToken: string,
    filename: string,
    request: Request,
    response: Response,
  ) {
    const project = await this.db.projectModel.findOne({
      viewerToken,
    });

    if (!project) {
      throw new CustomBadRequestException('unknown_viewer_token');
    }

    // if (mediaAccessUser.projectId !== projectId) {
    //   throw new CustomForbiddenException();
    // }

    const [mediaId, ext] = filename.split('.');

    // const [mediaId, resolution] = mediaIdResolution.split('_');

    // https://blog.logrocket.com/full-stack-app-tutorial-nestjs-react/
    // https://betterprogramming.pub/video-stream-with-node-js-and-html5-320b3191a6b6
    // https://www.geeksforgeeks.org/how-to-stream-large-mp4-files/

    // const audioFilepath = this.pathService.getMp3File(projectId);
    const mediaFilepath = this.pathService.getFile(
      project._id.toString(),
      filename,
    );
    try {
      const fileStats = await stat(mediaFilepath);

      const { range } = request.headers;
      let readStream: ReadStream;
      if (range) {
        // version 1
        // send in 1MB chunks
        // const CHUNK_SIZE2 = 1 * 1e6;
        // const start = Number(range.replace(/\D/g, ''));
        // const end = Math.min(start2 + CHUNK_SIZE2, videoStats.size - 1);
        // const chunksize = end - start + 1;

        // version 2
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        // in some cases end may not exists, if its not exists make it end of file
        const end = parts[1] ? parseInt(parts[1], 10) : fileStats.size - 1;
        // chunk size is what the part of video we are sending.
        const chunksize = end - start + 1;

        response.status(206); // Parial content header
        response.header({
          'Content-Range': `bytes ${start}-${end}/${fileStats.size}`,
          'Accept-Ranges': 'bytes',
          'Content-length': chunksize,
          'Content-Type': this._getMimetype(ext),
        });
        readStream = createReadStream(mediaFilepath, {
          start: start,
          end: end,
        });
      } else {
        //if not send the video from start
        response.status(200);
        response.header({
          'Content-Length': fileStats.size,
          'Content-Type': this._getMimetype(ext),
        });
        readStream = createReadStream(mediaFilepath);
      }
      // pipe stream to response
      readStream.pipe(response);
    } catch (error) {
      this.logger.error(error.message, { error });
      response.status(400).send('Bad Request');
    }
  }

  private _getMimetype(extension: string) {
    switch (extension) {
      // AUDIO
      case 'mp3':
        return 'audio/mp3';
      case 'wav':
        return 'audio/wav';

      // VIDEO
      case 'mp4':
        return 'video/mp4';

      // TEXT
      case 'json':
        return 'application/json';

      // unknown
      default:
        return 'text/plain';
    }
  }

  // TODO job that clears old tempfiles

  async createMediaFile(
    authUser: AuthUser,
    createMediaFileDto: CreateMediaFileDto,
  ): Promise<CreateMediaEntity> {
    // TODO auth
    // TODO check max file size

    const id = v4();
    const path = this.pathService.getTempDirectory(id);
    await ensureDir(path);

    const extension = extname(createMediaFileDto.filename);
    const metadata: MediaFileMetadata = {
      ...createMediaFileDto,
      uploadId: id,
      createdBy: authUser.id,
      extension,
    };

    const metadataPath = join(path, 'metadata.json');
    await writeJSON(metadataPath, metadata);

    const filename = this.pathService.getUploadFile(id, metadata.extension);
    await writeFile(filename, []);
    return { id };
  }

  async updateMediaFile(authUser: AuthUser, id: string, filePart: Buffer) {
    // TODO auth

    // if (Math.random() > 0.5) {
    //   throw new CustomBadRequestException('random_error');
    // }

    const metadataPath = this.pathService.getUploadMetadataFile(id);

    const metadataFileExists = await exists(metadataPath);
    if (!metadataFileExists) {
      throw new CustomBadRequestException('metadata_file_not_found');
    }

    const metadata: MediaFileMetadata = await readJson(metadataPath);

    if (metadata.createdBy !== authUser.id) {
      throw new CustomBadRequestException('access_to_file_denied');
    }

    const filename = this.pathService.getUploadFile(id, metadata.extension);
    const fileExists = await exists(filename);
    if (!fileExists) {
      throw new CustomBadRequestException('file_not_found');
    }

    const fileStat = await stat(filename);
    if (fileStat.size + filePart.length > metadata.filesize) {
      throw new CustomBadRequestException('file_too_large');
    }

    // Append file
    await appendFile(filename, filePart);
  }

  async getMetadata(id: string): Promise<MediaFileMetadata> {
    const metadataPath = this.pathService.getUploadMetadataFile(id);

    const metadataFileExists = await exists(metadataPath);
    if (!metadataFileExists) {
      throw new CustomBadRequestException('metadata_file_not_found');
    }

    const metadata: MediaFileMetadata = await readJson(metadataPath);

    return metadata;
  }

  // mediaService.getFilePath
  //

  /**
   * upload controller / service
   *
   */
}
