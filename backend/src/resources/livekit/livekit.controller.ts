import { Controller, Get, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { User } from '../auth/auth.decorator';
import { AuthUser } from '../auth/auth.interfaces';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LivekitAuthEntity } from './entities/livekit.entity';
import { LivekitService } from './livekit.service';

@Controller('livekit')
export class LivekitController {
  constructor(private livekitService: LivekitService) {}

  @UseGuards(JwtAuthGuard)
  @Get('token')
  @ApiResponse({ status: HttpStatus.OK })
  getToken(@User() authUser: AuthUser): Promise<LivekitAuthEntity> {
    return this.livekitService.getToken(authUser, 'projectId');
  }
}
