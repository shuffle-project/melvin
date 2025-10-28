import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeamManagementComponent } from './team-management.component';

describe('TeamManagementComponent', () => {
  let component: TeamManagementComponent;
  let fixture: ComponentFixture<TeamManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeamManagementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TeamManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
