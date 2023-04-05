import { Test, TestingModule } from '@nestjs/testing';
import { ConfigTestModule } from '../../../test/config-test.module';
import {
  MongooseTestModule,
  createMongooseTestModule,
} from '../../../test/mongoose-test.module';
import { EventsGateway } from '../events/events.gateway';
import { LivestreamModule } from './livestream.module';
import { LivestreamService } from './livestream.service';

describe('LivestreamService', () => {
  let module: TestingModule;
  let service: LivestreamService;
  let MongooseTestModule: MongooseTestModule;

  const eventsGateway = {
    serverIceCandidate: jest.fn(),
  };

  beforeEach(async () => {
    MongooseTestModule = await createMongooseTestModule();
    module = await Test.createTestingModule({
      imports: [ConfigTestModule, MongooseTestModule, LivestreamModule],
    })
      .overrideProvider(EventsGateway)
      .useValue(eventsGateway)
      .compile();

    service = module.get<LivestreamService>(LivestreamService);
  });

  afterEach(async () => {
    await MongooseTestModule.close(module);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // TODO tests
});
