import { TestBed } from '@angular/core/testing';

import { DeleteConfirmationService } from './delete-confirmation.service';

describe('DeleteConfirmationService', () => {
  let service: DeleteConfirmationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DeleteConfirmationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
