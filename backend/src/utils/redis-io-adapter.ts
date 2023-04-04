import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { ServerOptions } from 'socket.io';
import { RedisConfig } from '../config/config.interface';

export class RedisIoAdapter extends IoAdapter {
  private config: RedisConfig;

  private pubClient: any;
  private subClient: any;
  private redisAdapter: any;

  constructor(app: INestApplication, configService: ConfigService) {
    super(app);

    this.config = configService.get<RedisConfig>('redis');

    this.pubClient = createClient({
      url: `redis://${this.config.host}:${this.config.port}`,
    });
    this.subClient = this.pubClient.duplicate();
    this.redisAdapter = createAdapter(this.pubClient, this.subClient);
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, options);
    server.adapter(this.redisAdapter);
    return server;
  }
}
