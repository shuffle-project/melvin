import {
  Body,
  Controller,
  Delete,
  HttpStatus,
  Param,
  Patch,
  Post,
  RawBodyRequest,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

import { Request } from 'express';
import { User } from 'src/resources/auth/auth.decorator';
import { AuthUser } from 'src/resources/auth/auth.interfaces';
import { JwtAuthGuard } from 'src/resources/auth/guards/jwt-auth.guard';

import { CreateUploadDto, UploadEntity } from './upload.interfaces';
import { UploadService } from './upload.service';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiResponse({ status: HttpStatus.CREATED })
  async createMediaFile(
    @User() authUser: AuthUser,
    @Body()
    createMediaFileDto: CreateUploadDto,
  ): Promise<UploadEntity> {
    return this.uploadService.createUpload(authUser, createMediaFileDto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiResponse({ status: HttpStatus.OK })
  async updateMediaFile(
    @User() authUser: AuthUser,
    @Param('id') id: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    return this.uploadService.updateUpload(authUser, id, req.body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiResponse({ status: HttpStatus.OK })
  async cancelUpload(@User() authUser: AuthUser, @Param('id') id: string) {
    return this.uploadService.cancelUpload(authUser, id);
  }
}
