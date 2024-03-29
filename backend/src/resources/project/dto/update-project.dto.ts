import { IntersectionType, PartialType, PickType } from '@nestjs/swagger';
import { Project } from '../../../modules/db/schemas/project.schema';
import { CreateProjectDto } from './create-project.dto';

export class UpdateProjectDto extends IntersectionType(
  PartialType(CreateProjectDto),
  PartialType(PickType(Project, ['status'] as const)),
) {
  // darf nur der systemuser
  duration?: number; // not needed in swagger api, only needed for internal use
}
