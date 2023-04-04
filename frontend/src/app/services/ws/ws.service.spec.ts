import { TestBed } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { WSService } from './ws.service';

describe('WSService', () => {
  let service: WSService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideMockStore()] });
    service = TestBed.inject(WSService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
