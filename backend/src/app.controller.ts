import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { ConfigEntity, Hello } from './app.interfaces';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiResponse({ status: HttpStatus.OK, type: Hello })
  getHello(): Hello {
    return this.appService.getHello();
  }

  @Get('config')
  @ApiResponse({ status: HttpStatus.OK, type: ConfigEntity })
  getConfig(): Promise<ConfigEntity> {
    return this.appService.getConfig();
  }
}
