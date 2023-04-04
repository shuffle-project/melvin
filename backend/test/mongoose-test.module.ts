import { DynamicModule } from '@nestjs/common';
import {
  getConnectionToken,
  MongooseModule,
  MongooseModuleOptions,
} from '@nestjs/mongoose';
import { TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection } from 'mongoose';

export interface MongooseTestModule extends DynamicModule {
  close: (module: TestingModule) => Promise<void>;
}

export const createMongooseTestModule = async (
  options: MongooseModuleOptions = {},
): Promise<MongooseTestModule> => {
  let mongod: MongoMemoryServer;

  const MongooseTestModule = MongooseModule.forRootAsync({
    useFactory: async () => {
      mongod = await MongoMemoryServer.create();

      const mongoUri = mongod.getUri();
      return {
        uri: mongoUri,
        ...options,
      };
    },
  }) as MongooseTestModule;

  MongooseTestModule.close = async (module: TestingModule) => {
    const connection: Connection = await module.get(getConnectionToken());
    await connection.close();
    await mongod.stop();
  };

  return MongooseTestModule;
};
