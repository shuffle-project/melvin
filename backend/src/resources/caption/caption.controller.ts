import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { CaptionHistory } from '../../modules/db/schemas/caption.schema';
import { IsValidObjectIdPipe } from '../../pipes/is-valid-objectid.pipe';
import { User } from '../auth/auth.decorator';
import { AuthUser } from '../auth/auth.interfaces';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CaptionService } from './caption.service';
import { CreateCaptionDto } from './dto/create-caption.dto';
import { FindAllCaptionsQuery } from './dto/find-all-captions.dto';
import { UpdateCaptionDto } from './dto/update-caption.dto';
import { CaptionListEntity } from './entities/caption-list.entity';
import { CaptionEntity } from './entities/caption.entity';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('captions')
export class CaptionController {
  constructor(private readonly captionService: CaptionService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiResponse({ status: HttpStatus.CREATED, type: CaptionEntity })
  async create(
    @User() authUser: AuthUser,
    @Body() createCaptionDto: CreateCaptionDto,
  ): Promise<CaptionEntity> {
    return this.captionService.create(authUser, createCaptionDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiResponse({ status: HttpStatus.OK, type: CaptionListEntity })
  async findAll(
    @User() authUser: AuthUser,
    @Query() query: FindAllCaptionsQuery,
  ): Promise<CaptionListEntity> {
    return this.captionService.findAll(authUser, query);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiResponse({ status: HttpStatus.OK, type: CaptionEntity })
  async findOne(
    @User() authUser: AuthUser,
    @Param('id', IsValidObjectIdPipe) captionId: string,
  ): Promise<CaptionEntity> {
    return this.captionService.findOne(authUser, captionId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiResponse({ status: HttpStatus.OK, type: CaptionEntity })
  async update(
    @User() authUser: AuthUser,
    @Param('id', IsValidObjectIdPipe) captionId: string,
    @Body() updateCaptionDto: UpdateCaptionDto,
  ): Promise<CaptionEntity> {
    return this.captionService.update(authUser, captionId, updateCaptionDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  async remove(
    @User() authUser: AuthUser,
    @Param('id', IsValidObjectIdPipe) captionId: string,
  ): Promise<void> {
    return this.captionService.remove(authUser, captionId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/history')
  @ApiResponse({ status: HttpStatus.OK, type: [CaptionHistory] })
  async getHistory(
    @User() authUser: AuthUser,
    @Param('id', IsValidObjectIdPipe) captionId: string,
  ): Promise<CaptionHistory[]> {
    return this.captionService.getHistory(authUser, captionId);
  }
}
