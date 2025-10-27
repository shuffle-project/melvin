import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { IsValidObjectIdPipe } from 'src/pipes/is-valid-objectid.pipe';
import { Roles, User } from '../auth/auth.decorator';
import { AuthUser } from '../auth/auth.interfaces';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from '../user/user.interfaces';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { TeamListEntity } from './entities/team-list.entity';
import { TeamEntity } from './entities/team.entity';
import { TeamService } from './team.service';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('teams')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  create(
    @Body() createTeamDto: CreateTeamDto,
    @User() authUser: AuthUser,
  ): Promise<TeamEntity> {
    return this.teamService.create(createTeamDto, authUser);
  }

  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  @Get()
  findAll(@User() authUser: AuthUser): Promise<TeamListEntity> {
    return this.teamService.findAll(authUser);
  }

  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  @Get(':id')
  findOne(
    @Param('id', IsValidObjectIdPipe) id: string,
    @User() authUser: AuthUser,
  ): Promise<TeamEntity> {
    return this.teamService.findOne(id, authUser);
  }

  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id')
  update(
    @Param('id', IsValidObjectIdPipe) id: string,
    @Body() updateTeamDto: UpdateTeamDto,
    @User() authUser: AuthUser,
  ): Promise<TeamEntity> {
    return this.teamService.update(id, updateTeamDto, authUser);
  }

  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(
    @Param('id', IsValidObjectIdPipe) id: string,
    @User() authUser: AuthUser,
  ): Promise<void> {
    return this.teamService.remove(id, authUser);
  }
}
