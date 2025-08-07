import { Controller, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { IsValidObjectIdPipe } from 'src/pipes/is-valid-objectid.pipe';
import { User } from '../auth/auth.decorator';
import { AuthUser } from '../auth/auth.interfaces';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LivekitAuthEntity } from './entities/livekit.entity';
import { LivekitService } from './livekit.service';

@Controller('livekit')
export class LivekitController {
  constructor(private livekitService: LivekitService) {}

  @UseGuards(JwtAuthGuard)
  @Post('authenticate/:id')
  @ApiResponse({ status: HttpStatus.OK })
  authenticate(
    @User() authUser: AuthUser,
    @Param('id', IsValidObjectIdPipe) id: string,
  ): Promise<LivekitAuthEntity> {
    return this.livekitService.authenticate(authUser, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('authenticate-viewer/:id')
  @ApiResponse({ status: HttpStatus.OK })
  authenticateViewer(
    @User() authUser: AuthUser,
    @Param('id') viewerToken: string,
  ): Promise<LivekitAuthEntity> {
    return this.livekitService.authenticateViewer(authUser, viewerToken);
  }
}
