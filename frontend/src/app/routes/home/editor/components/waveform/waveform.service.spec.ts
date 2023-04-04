import { TestBed } from '@angular/core/testing';

import { WaveformService } from './waveform.service';

describe('WaveformService', () => {
  let service: WaveformService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WaveformService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
