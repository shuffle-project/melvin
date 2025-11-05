import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { DbService } from 'src/modules/db/db.service';
import {
  CustomBadRequestException,
  CustomForbiddenException,
} from 'src/utils/exceptions';
import { isSameObjectId } from 'src/utils/objectid';
import { AuthUser } from '../auth/auth.interfaces';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { TeamListEntity } from './entities/team-list.entity';
import { TeamEntity } from './entities/team.entity';

@Injectable()
export class TeamService {
  constructor(private db: DbService) {}

  async create(createTeamDto: CreateTeamDto, authUser: AuthUser) {
    if (authUser.role !== 'admin') {
      throw new CustomForbiddenException('permission_denied');
    }

    const duplicateName = await this.db.teamModel
      .findOne({ name: createTeamDto.name })
      .lean()
      .exec();

    if (duplicateName) {
      throw new CustomBadRequestException('team_name_exists');
    }

    const team = await this.db.teamModel.create({ ...createTeamDto });

    return plainToInstance(TeamEntity, { ...team.toObject(), size: 0 });
  }

  async findAll(authUser: AuthUser): Promise<TeamListEntity> {
    if (authUser.role !== 'admin') {
      throw new CustomForbiddenException('permission_denied');
    }

    let teams = await this.db.teamModel.find().lean().exec();
    const teamsizes = await Promise.all(
      teams.map((team) => {
        return this.db.getTeamSize(team._id.toString());
      }),
    );

    return plainToInstance(TeamListEntity, {
      teams: teams.map((team, index) => ({ ...team, size: teamsizes[index] })),
    });
  }

  async findOne(id: string, authUser: AuthUser) {
    if (authUser.role !== 'admin') {
      throw new CustomForbiddenException('permission_denied');
    }

    const team = this.db.teamModel.findById(id).exec();

    if (!team) {
      throw new CustomBadRequestException('team_not_found');
    }

    const size = await this.db.getTeamSize(id);
    return plainToInstance(TeamEntity, { ...team, size });
  }

  async update(id: string, updateTeamDto: UpdateTeamDto, authUser: AuthUser) {
    if (authUser.role !== 'admin') {
      throw new CustomForbiddenException('permission_denied');
    }

    if (updateTeamDto.name) {
      const duplicateName = await this.db.teamModel
        .findOne({ name: updateTeamDto.name })
        .lean()
        .exec();
      if (duplicateName && !isSameObjectId(duplicateName, id)) {
        throw new CustomBadRequestException('team_name_exists');
      }
    }

    const newTeam = await this.db.teamModel
      .findByIdAndUpdate(
        id,
        {
          ...updateTeamDto,
        },
        { new: true },
      )
      .lean()
      .exec();

    const size = await this.db.getTeamSize(id);
    return plainToInstance(TeamEntity, { ...newTeam, size });
  }

  async remove(id: string, authUser: AuthUser) {
    if (authUser.role !== 'admin') {
      throw new CustomForbiddenException('permission_denied');
    }

    await this.db.userModel
      .updateMany({ team: id }, { $unset: { team: null } })
      .exec();

    await this.db.teamModel.findByIdAndDelete(id).exec();

    return;
  }
}
