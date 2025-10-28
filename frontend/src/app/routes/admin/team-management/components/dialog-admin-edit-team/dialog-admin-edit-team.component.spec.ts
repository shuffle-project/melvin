import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogAdminEditTeamComponent } from './dialog-admin-edit-team.component';

describe('DialogAdminEditTeamComponent', () => {
  let component: DialogAdminEditTeamComponent;
  let fixture: ComponentFixture<DialogAdminEditTeamComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogAdminEditTeamComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogAdminEditTeamComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
