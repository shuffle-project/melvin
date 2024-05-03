import { TestBed } from '@angular/core/testing';

import { ViewerService } from './services/viewer.service';

describe('ViewerService', () => {
  let service: ViewerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ViewerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
