import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { gbToBytes } from 'src/utils/storage';
import { AuthUser } from '../../resources/auth/auth.interfaces';
import { UserRole } from '../../resources/user/user.interfaces';
import { getObjectIdAsString, isSameObjectId } from '../../utils/objectid';
import { DbService } from '../db/db.service';
import {
  LeanProjectDocument,
  ProjectStatus,
} from '../db/schemas/project.schema';
import { Team } from '../db/schemas/team.schema';
import { LeanTranscriptionDocument } from '../db/schemas/transcription.schema';

@Injectable()
export class PermissionsService {
  constructor(private configService: ConfigService, private db: DbService) {}

  async isUserSizeLimitReached(authUser: AuthUser) {
    const user = await this.db.userModel
      .findById(authUser.id)
      .populate('team')
      .lean()
      .exec();

    let size: number = undefined;

    const sizeLimit =
      (user.team as Team)?.sizeLimit ??
      user.sizeLimit ??
      gbToBytes(this.configService.get<number>('defaultUserSizeLimitGB'));
    if (sizeLimit === -1) {
      return false;
    }

    if (user.team) {
      size = await this.db.getTeamSize(getObjectIdAsString(user.team));
    } else {
      size = await this.db.getUserSize(getObjectIdAsString(user._id));
    }

    return size >= sizeLimit;
  }

  isProjectReadable(project: LeanProjectDocument, authUser: AuthUser): boolean {
    return (
      this.isProjectMember(project, authUser) ||
      this.isProjectViewer(project, authUser)
    );
  }

  isProjectViewer(project: LeanProjectDocument, authUser: AuthUser): boolean {
    if (authUser.role !== UserRole.VIEWER) {
      return false;
    }
    return isSameObjectId(authUser.id, project._id ? project._id : project);
  }

  isProjectOwner(project: LeanProjectDocument, authUser: AuthUser): boolean {
    if (authUser.role === UserRole.VIEWER) {
      return false;
    }
    if (authUser.role === UserRole.SYSTEM) {
      return true;
    }
    return isSameObjectId(project.createdBy, authUser.id);
  }

  isProjectMember(project: LeanProjectDocument, authUser: AuthUser): boolean {
    if (authUser.role === UserRole.VIEWER) {
      return false;
    }
    if (authUser.role === UserRole.SYSTEM) {
      return true;
    }
    return project.users.some((o) => isSameObjectId(o, authUser.id));
  }

  isTranscriptionOwner(
    transcription: LeanTranscriptionDocument,
    authUser: AuthUser,
  ): boolean {
    if (authUser.role === UserRole.VIEWER) {
      return false;
    }
    if (authUser.role === UserRole.SYSTEM) {
      return true;
    }
    return isSameObjectId(transcription.createdBy, authUser.id);
  }

  isProjectStatusEditable(
    isOwner: boolean,
    project: LeanProjectDocument,
    status: ProjectStatus,
  ): boolean {
    if (
      isOwner &&
      [ProjectStatus.LIVE].includes(project.status) &&
      [ProjectStatus.LIVE, , ProjectStatus.DRAFT].includes(status)
    ) {
      // if ( // TODO
      //   isOwner &&
      //   [ProjectStatus.LIVE, ProjectStatus.PAUSED].includes(project.status) &&
      //   [ProjectStatus.LIVE, ProjectStatus.PAUSED, ProjectStatus.DRAFT].includes(
      //     status,
      //   )
      // ) {
      return true;
    } else if (
      [ProjectStatus.DRAFT, ProjectStatus.FINISHED].includes(project.status) &&
      [ProjectStatus.DRAFT, ProjectStatus.FINISHED].includes(status)
    ) {
      return true;
    }

    return false;
  }
}
