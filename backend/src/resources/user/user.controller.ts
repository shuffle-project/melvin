import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpStatus,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { User } from '../auth/auth.decorator';
import { AuthUser } from '../auth/auth.interfaces';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FindAllUsersQuery } from './dto/find-all-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
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

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  delete(
    @Body() dto: { password: string },
    @User() authUser: AuthUser,
  ): Promise<void> {
    return this.userService.remove(authUser, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch()
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  update(
    @Body() dto: UpdateUserDto,
    @User() authUser: AuthUser,
  ): Promise<UserEntity> {
    return this.userService.update(authUser, dto);
  }
}
