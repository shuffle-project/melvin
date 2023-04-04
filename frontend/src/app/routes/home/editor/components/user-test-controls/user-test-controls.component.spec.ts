import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserTestControlsComponent } from './user-test-controls.component';

describe('UserTestControlsComponent', () => {
  let component: UserTestControlsComponent;
  let fixture: ComponentFixture<UserTestControlsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UserTestControlsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserTestControlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
