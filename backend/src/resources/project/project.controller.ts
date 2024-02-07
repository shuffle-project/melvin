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
  Req,
  Res,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiConsumes, ApiResponse } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Project } from '../../modules/db/schemas/project.schema';
import { IsValidFilenamePipe } from '../../pipes/is-valid-filename.pipe';
import { IsValidObjectIdPipe } from '../../pipes/is-valid-objectid.pipe';
import { MediaUser, User } from '../auth/auth.decorator';
import { AuthUser, MediaAccessUser } from '../auth/auth.interfaces';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateProjectDto } from './dto/create-project.dto';
import { FindAllProjectsQuery } from './dto/find-all-projects.dto';
import { InviteDto } from './dto/invite.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { UploadVideoDto } from './dto/upload-media.dto';
import { ProjectInviteTokenEntity } from './entities/project-invite.entity';
import { ProjectListEntity } from './entities/project-list.entity';
import { ProjectEntity, ProjectMediaEntity } from './entities/project.entity';
import { MediaFileInterceptor } from './interceptors/media-file.interceptor';
import { MultiFileInterceptor } from './interceptors/multi-file.interceptor';
import { ProjectService } from './project.service';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiConsumes('application/json', 'multipart/form-data')
  @UseInterceptors(MultiFileInterceptor)
  @ApiResponse({ status: HttpStatus.CREATED, type: ProjectEntity })
  async create(
    @User() authUser: AuthUser,
    @Body()
    createProjectDto: CreateProjectDto,
    @UploadedFiles() //TODO swagger
    files?: {
      video: Array<Express.Multer.File>;
      subtitles: Array<Express.Multer.File>;
    },
  ) {
    return await this.projectService.create(
      authUser,
      createProjectDto,
      files?.video ? files.video : null,
      files?.subtitles ? files.subtitles : null,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiResponse({ status: HttpStatus.OK, type: ProjectListEntity })
  findAll(
    @User() authUser: AuthUser,
    @Query() query: FindAllProjectsQuery,
  ): Promise<ProjectListEntity> {
    return this.projectService.findAll(authUser, query);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiResponse({ status: HttpStatus.OK, type: Project })
  findOne(
    @User() authUser: AuthUser,
    @Param('id', IsValidObjectIdPipe) id: string,
  ): Promise<ProjectEntity> {
    return this.projectService.findOne(authUser, id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @UseInterceptors(MediaFileInterceptor)
  @ApiResponse({ type: ProjectEntity })
  update(
    @User() authUser: AuthUser,
    @Param('id', IsValidObjectIdPipe) id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @UploadedFile() file?: Express.Multer.File, //TODO swagger
  ): Promise<ProjectEntity> {
    return this.projectService.update(authUser, id, updateProjectDto, file);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  remove(
    @User() authUser: AuthUser,
    @Param('id', IsValidObjectIdPipe) id: string,
  ): Promise<void> {
    return this.projectService.remove(authUser, id);
  }

  // websocket connection

  @UseGuards(JwtAuthGuard)
  @Post(':id/subscribe')
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  subscribe(
    @User() authUser: AuthUser,
    @Param('id', IsValidObjectIdPipe) id: string,
  ): Promise<void> {
    return this.projectService.subscribe(authUser, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/unsubscribe')
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  unsubscribe(
    @User() authUser: AuthUser,
    @Param('id', IsValidObjectIdPipe) id: string,
  ): Promise<void> {
    return this.projectService.unsubscribe(authUser, id);
  }

  // invites

  @UseGuards(JwtAuthGuard)
  @Post(':id/invite')
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  invite(
    @User() authUser: AuthUser,
    @Param('id', IsValidObjectIdPipe) id: string,
    @Body() inviteDto: InviteDto,
  ): Promise<void> {
    return this.projectService.invite(authUser, id, inviteDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/invite-token')
  @ApiResponse({ status: HttpStatus.OK, type: ProjectInviteTokenEntity })
  getInviteToken(
    @User() authUser: AuthUser,
    @Param('id', IsValidObjectIdPipe) id: string,
  ): Promise<ProjectInviteTokenEntity> {
    return this.projectService.getInviteToken(authUser, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/invite-token')
  @ApiResponse({ status: HttpStatus.OK, type: ProjectInviteTokenEntity })
  updateInviteToken(
    @User() authUser: AuthUser,
    @Param('id', IsValidObjectIdPipe) id: string,
  ): Promise<ProjectInviteTokenEntity> {
    return this.projectService.updateInviteToken(authUser, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('invite-token')
  @ApiResponse({ status: HttpStatus.OK, type: null })
  joinViaInviteToken(
    @User() authUser: AuthUser,
    @Body() inviteToken: { inviteToken: string },
  ): Promise<void> {
    return this.projectService.joinViaInviteToken(
      authUser,
      inviteToken.inviteToken,
    );
  }

  // file management
  @UseGuards(JwtAuthGuard)
  @Get(':id/media/:filename')
  @ApiResponse({ status: HttpStatus.PARTIAL_CONTENT })
  async getAdditionalVideoChunk(
    @Param('id', IsValidObjectIdPipe) id: string,
    @Param('filename', IsValidFilenamePipe) filename: string,
    @MediaUser() mediaAccessUser: MediaAccessUser,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.projectService.getMediaChunk(
      id,
      mediaAccessUser,
      req,
      res,
      filename,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/media/upload')
  @UseInterceptors(MediaFileInterceptor)
  @ApiResponse({ type: ProjectEntity })
  uploadVideo(
    @User() authUser: AuthUser,
    @Param('id', IsValidObjectIdPipe) id: string,
    @Body() uploadMediaDto: UploadVideoDto,
    @UploadedFile() file: Express.Multer.File, //
  ): Promise<ProjectEntity> {
    return this.projectService.uploadVideo(authUser, id, uploadMediaDto, file);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/media/:mediaId')
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  async deleteAdditionalMedia(
    @User() authUser: AuthUser,
    @Param('id', IsValidObjectIdPipe) id: string,
    @Param('mediaId', IsValidObjectIdPipe) mediaId: string,
  ): Promise<ProjectMediaEntity> {
    return this.projectService.deleteMedia(authUser, id, mediaId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/media')
  getMediaEntity(
    @User() authUser: AuthUser,
    @Param('id', IsValidObjectIdPipe) id: string,
  ): Promise<ProjectMediaEntity> {
    return this.projectService.getMediaEntity(authUser, id);
  }
}
