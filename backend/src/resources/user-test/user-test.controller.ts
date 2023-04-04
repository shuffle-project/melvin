import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { IsValidObjectIdPipe } from '../../pipes/is-valid-objectid.pipe';
import { UserTestService } from './user-test.service';

@Controller('user-test')
export class UserTestController {
  constructor(private readonly userTestService: UserTestService) {}

  @Post('populate')
  async populate(): Promise<void> {
    return this.userTestService.populate();
  }
  @Post('start')
  async start(
    @Body('projectId', IsValidObjectIdPipe) projectId: string,
  ): Promise<void> {
    return this.userTestService.start(projectId);
  }

  @Post('stop')
  async stop(
    @Body('projectId', IsValidObjectIdPipe) projectId: string,
  ): Promise<void> {
    return this.userTestService.stop(projectId);
  }

  @Post('reset')
  async reset(
    @Body('projectId', IsValidObjectIdPipe) projectId: string,
  ): Promise<void> {
    return this.userTestService.reset(projectId);
  }

  @Get('download/:projectId')
  async downloadResults(
    @Param('projectId', IsValidObjectIdPipe) projectId: string,
  ): Promise<any> {
    return this.userTestService.downloadResults(projectId);
  }
}
