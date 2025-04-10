import { Injectable } from '@nestjs/common';
import { appendFile, ensureDir, exists, readJson, writeJSON } from 'fs-extra';
import { rm, stat, writeFile } from 'fs/promises';
import { extname, join } from 'path';
import { AuthUser } from 'src/resources/auth/auth.interfaces';
import { UserRole } from 'src/resources/user/user.interfaces';
import { CustomBadRequestException } from 'src/utils/exceptions';
import { v4 } from 'uuid';
import { CustomLogger } from '../logger/logger.service';

import { PathService } from '../path/path.service';
import {
  CreateUploadDto,
  UploadEntity,
  UploadMetadata,
} from './upload.interfaces';

@Injectable()
export class UploadService {
  constructor(
    private readonly pathService: PathService,
    private logger: CustomLogger,
  ) {
    this.logger.setContext(this.constructor.name);
  }

  async createUpload(
    authUser: AuthUser,
    createMediaFileDto: CreateUploadDto,
  ): Promise<UploadEntity> {
    // TODO check max file size

    // upload only allowed for admins, systems and users
    if (
      ![UserRole.ADMIN, UserRole.SYSTEM, UserRole.USER].includes(authUser.role)
    ) {
      throw new CustomBadRequestException('not_allowed_to_upload_files');
    }

    const id = v4();
    const path = this.pathService.getTempDirectory(id);
    await ensureDir(path);

    const extension = extname(createMediaFileDto.filename);
    const metadata: UploadMetadata = {
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

  async updateUpload(authUser: AuthUser, id: string, filePart: Buffer) {
    // if (Math.random() > 0.5) {
    //   throw new CustomBadRequestException('random_error');
    // }

    const metadataPath = this.pathService.getUploadMetadataFile(id);

    const metadataFileExists = await exists(metadataPath);
    if (!metadataFileExists) {
      throw new CustomBadRequestException('metadata_file_not_found');
    }

    const metadata: UploadMetadata = await readJson(metadataPath);

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

  async cancelUpload(authUser: AuthUser, id: string) {
    const metadataPath = this.pathService.getUploadMetadataFile(id);

    const metadataFileExists = await exists(metadataPath);
    if (!metadataFileExists) {
      throw new CustomBadRequestException('metadata_file_not_found');
    }

    const metadata: UploadMetadata = await readJson(metadataPath);

    if (metadata.createdBy !== authUser.id) {
      throw new CustomBadRequestException('access_to_file_denied');
    }

    const filename = this.pathService.getUploadFile(id, metadata.extension);
    const fileExists = await exists(filename);
    if (!fileExists) {
      throw new CustomBadRequestException('file_not_found');
    }

    // Delete temp folder
    const path = this.pathService.getUploadDirectory(id);
    await rm(path, { recursive: true });
  }

  async getUploadMetadata(id: string): Promise<UploadMetadata> {
    const metadataPath = this.pathService.getUploadMetadataFile(id);

    const metadataFileExists = await exists(metadataPath);
    if (!metadataFileExists) {
      throw new CustomBadRequestException('metadata_file_not_found');
    }

    const metadata: UploadMetadata = await readJson(metadataPath);

    return metadata;
  }
}
