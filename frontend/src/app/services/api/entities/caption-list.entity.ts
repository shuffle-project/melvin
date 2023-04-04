import { CaptionEntity } from './caption.entity';

export interface CaptionListEntity {
  captions: CaptionEntity[];
  total: number;
  page: number;
}
