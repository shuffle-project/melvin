import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CaptionEntity } from './caption.entity';

export class CaptionListEntity {
  @ApiProperty({ type: [CaptionEntity] })
  @Type(() => CaptionEntity)
  public captions: CaptionEntity[];

  @ApiProperty()
  public total: number;

  @ApiProperty()
  public page: number;

  @ApiProperty()
  public count: number;
}
