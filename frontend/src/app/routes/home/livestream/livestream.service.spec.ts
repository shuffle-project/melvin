import { TestBed } from '@angular/core/testing';

import { LivestreamService } from './livestream.service';

describe('LivestreamService', () => {
  let service: LivestreamService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LivestreamService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
