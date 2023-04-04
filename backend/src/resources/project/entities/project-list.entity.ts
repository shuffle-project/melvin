import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ProjectEntity } from './project.entity';

export class ProjectListEntity {
  @ApiProperty({ type: [ProjectEntity] })
  @Type(() => ProjectEntity)
  public projects: ProjectEntity[];

  @ApiProperty()
  public total: number;

  @ApiProperty()
  public page: number;

  @ApiProperty()
  public count: number;
}
