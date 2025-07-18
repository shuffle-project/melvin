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
import { Project } from '../../modules/db/schemas/project.schema';
import { IsValidObjectIdPipe } from '../../pipes/is-valid-objectid.pipe';
import { User } from '../auth/auth.decorator';
import { AuthUser } from '../auth/auth.interfaces';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PopulateService } from '../populate/populate.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { FindAllProjectsQuery } from './dto/find-all-projects.dto';
import { InviteDto } from './dto/invite.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { UploadVideoDto } from './dto/upload-media.dto';
import { ProjectInviteTokenEntity } from './entities/project-invite.entity';
import { ProjectListEntity } from './entities/project-list.entity';
import { ProjectViewerTokenEntity } from './entities/project-viewer.entity';
import { ProjectEntity, ProjectMediaEntity } from './entities/project.entity';
import { MediaFileInterceptor } from './interceptors/media-file.interceptor';
import { ProjectService } from './project.service';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('projects')
export class ProjectController {
  constructor(
    private readonly projectService: ProjectService,
    private populateService: PopulateService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('default')
  @ApiResponse({ status: HttpStatus.CREATED })
  async createDefault(@User() authUser: AuthUser) {
    return await this.populateService._generateDefaultProject(authUser.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiResponse({ status: HttpStatus.CREATED, type: ProjectEntity })
  async create(
    @User() authUser: AuthUser,
    @Body()
    createProjectDto: CreateProjectDto,
  ) {
    return await this.projectService.create(authUser, createProjectDto);
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
  ): Promise<ProjectEntity> {
    return this.projectService.update(authUser, id, updateProjectDto);
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

  // viewer

  @UseGuards(JwtAuthGuard)
  @Get(':id/viewer-token')
  @ApiResponse({ status: HttpStatus.OK, type: ProjectViewerTokenEntity })
  getViewerToken(
    @User() authUser: AuthUser,
    @Param('id', IsValidObjectIdPipe) id: string,
  ): Promise<ProjectViewerTokenEntity> {
    return this.projectService.getViewerToken(authUser, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/viewer-token')
  @ApiResponse({ status: HttpStatus.OK, type: ProjectInviteTokenEntity })
  updateViewerToken(
    @User() authUser: AuthUser,
    @Param('id', IsValidObjectIdPipe) id: string,
  ): Promise<ProjectViewerTokenEntity> {
    return this.projectService.updateViewerToken(authUser, id);
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

  @UseGuards(JwtAuthGuard)
  @Post(':id/media/create')
  @ApiResponse({ type: ProjectEntity })
  createVideo(
    @User() authUser: AuthUser,
    @Param('id', IsValidObjectIdPipe) id: string,
    @Body() uploadMediaDto: UploadVideoDto,
  ): Promise<ProjectEntity> {
    return this.projectService.createVideo(authUser, id, uploadMediaDto);
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

  @UseGuards(JwtAuthGuard)
  @Delete(':id/users/:userId')
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  removeCollaborator(
    @User() authUser: AuthUser,
    @Param('id', IsValidObjectIdPipe) id: string,
    @Param('userId', IsValidObjectIdPipe) userId: string,
  ): Promise<void> {
    return this.projectService.removeUserFromProject(authUser, id, userId);
  }
}
