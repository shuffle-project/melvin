import { Controller, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PopulateUser } from '../../config/config.interface';
import { PopulateService } from './populate.service';

@Controller('populate')
export class PopulateController {
  constructor(
    private populateService: PopulateService,
    private configService: ConfigService,
  ) {}

  @Post()
  async populateDatabase(): Promise<any> {
    const populateUsers =
      this.configService.get<PopulateUser[]>('initialUsers');
    return this.populateService.populate(populateUsers, 20);
  }
}
