import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogAdminResetPasswordComponent } from './dialog-admin-reset-password.component';

describe('DialogAdminResetPasswordComponent', () => {
  let component: DialogAdminResetPasswordComponent;
  let fixture: ComponentFixture<DialogAdminResetPasswordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogAdminResetPasswordComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogAdminResetPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
