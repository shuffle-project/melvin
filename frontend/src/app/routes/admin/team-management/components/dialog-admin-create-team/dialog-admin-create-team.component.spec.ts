import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogAdminCreateTeamComponent } from './dialog-admin-create-team.component';

describe('DialogAdminCreateTeamComponent', () => {
  let component: DialogAdminCreateTeamComponent;
  let fixture: ComponentFixture<DialogAdminCreateTeamComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogAdminCreateTeamComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogAdminCreateTeamComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
