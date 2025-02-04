import { TestBed } from '@angular/core/testing';

import { RecorderService } from './recorder.service';

describe('RecorderService', () => {
  let service: RecorderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RecorderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
