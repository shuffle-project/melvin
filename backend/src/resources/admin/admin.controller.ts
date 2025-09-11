import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { IsValidObjectIdPipe } from 'src/pipes/is-valid-objectid.pipe';
import { Roles } from '../auth/auth.decorator';
import { AuthLoginResponseDto } from '../auth/dto/auth-login.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from '../user/user.interfaces';
import { AdminService } from './admin.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserListEntity } from './entities/user-list.entity';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('/login')
  async login(@Body() dto: AdminLoginDto): Promise<AuthLoginResponseDto> {
    return this.adminService.adminLogin(dto);
  }

  @Post('/users')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  async createUser(@Body() dto: CreateUserDto): Promise<any> {
    return this.adminService.createUser(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  @Delete('/users/:id')
  async deleteUser(@Param('id', IsValidObjectIdPipe) id: string): Promise<any> {
    return this.adminService.deleteUser(id);
  }

  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  @Post('/users/:id/reset-password')
  async resetPasswort(
    @Param('id', IsValidObjectIdPipe) id: string,
  ): Promise<{ password: string }> {
    return this.adminService.resetPassword(id);
  }

  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  @Patch('/users/:id')
  async updateUser(
    @Body() dto: UpdateUserDto,
    @Param('id', IsValidObjectIdPipe) id: string,
  ): Promise<any> {
    return this.adminService.updateUser(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  @Get('/users')
  @ApiResponse({ status: HttpStatus.OK, type: UserListEntity })
  getUserList(): Promise<UserListEntity> {
    return this.adminService.getUserList();
  }
}
