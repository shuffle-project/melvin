import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpStatus,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { BasicAuthGuard } from '../auth/guards/basic-auth.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FindAllUsersQuery } from './dto/find-all-users.dto';
import { UserEntity } from './entities/user.entity';
import { UserService } from './user.service';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiResponse({ status: HttpStatus.OK, type: [UserEntity] })
  findAll(@Query() query: FindAllUsersQuery): Promise<UserEntity[]> {
    return this.userService.findAll(query);
  }

  @UseGuards(BasicAuthGuard)
  @Get('admininfo')
  getAdminInfo(): Promise<any> {
    return this.userService.getAdminInfo();
  }
}
