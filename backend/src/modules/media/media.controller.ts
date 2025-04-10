import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpStatus,
  Param,
  Req,
  Res,
  UseInterceptors,
} from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { IsValidFilenamePipe } from 'src/pipes/is-valid-filename.pipe';
import { MediaService } from './media.service';

import { Request, Response } from 'express';

// return `${this.serverBaseUrl}/media/${viewerToken}/${mediaId}.${mediaExtension}`;

@UseInterceptors(ClassSerializerInterceptor)
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get('/:viewerToken/:filename')
  @ApiResponse({ status: HttpStatus.PARTIAL_CONTENT })
  async getMediaChunk(
    @Param('viewerToken') viewerToken: string,
    @Param('filename', IsValidFilenamePipe) filename: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.mediaService.getMediaChunk(viewerToken, filename, req, res);
  }
}
