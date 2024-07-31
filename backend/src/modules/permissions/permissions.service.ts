import { Injectable } from '@nestjs/common';
import { AuthUser } from '../../resources/auth/auth.interfaces';
import { UserRole } from '../../resources/user/user.interfaces';
import { isSameObjectId } from '../../utils/objectid';
import {
  LeanProjectDocument,
  ProjectStatus,
} from '../db/schemas/project.schema';
import { LeanTranscriptionDocument } from '../db/schemas/transcription.schema';

@Injectable()
export class PermissionsService {
  isProjectReadable(project: LeanProjectDocument, authUser: AuthUser): boolean {
    return (
      this.isProjectMember(project, authUser)
      ||
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
