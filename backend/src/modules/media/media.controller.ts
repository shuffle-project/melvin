import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  RawBodyRequest,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { IsValidFilenamePipe } from 'src/pipes/is-valid-filename.pipe';
import { MediaService } from './media.service';

import { Request, Response } from 'express';
import { User } from 'src/resources/auth/auth.decorator';
import { AuthUser } from 'src/resources/auth/auth.interfaces';
import { JwtAuthGuard } from 'src/resources/auth/guards/jwt-auth.guard';
import { CreateMediaEntity, CreateMediaFileDto } from './media.interfaces';

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

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiResponse({ status: HttpStatus.CREATED })
  async createMediaFile(
    @User() authUser: AuthUser,
    @Body()
    createMediaFileDto: CreateMediaFileDto,
  ): Promise<CreateMediaEntity> {
    return this.mediaService.createMediaFile(authUser, createMediaFileDto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiResponse({ status: HttpStatus.OK })
  async updateMediaFile(
    @User() authUser: AuthUser,
    @Param('id') id: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    return this.mediaService.updateMediaFile(authUser, id, req.body);
  }
}
