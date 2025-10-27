import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogAdminUpdateUserComponent } from './dialog-admin-update-user.component';

describe('DialogAdminUpdateUserComponent', () => {
  let component: DialogAdminUpdateUserComponent;
  let fixture: ComponentFixture<DialogAdminUpdateUserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogAdminUpdateUserComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogAdminUpdateUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
