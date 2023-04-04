import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { HasRoleGuard } from './has-role.guard';

describe('HasRoleGuard', () => {
  let guard: HasRoleGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [provideMockStore()],
    });
    guard = TestBed.inject(HasRoleGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
