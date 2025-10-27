import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogAdminEditEmailComponent } from './dialog-admin-edit-email.component';

describe('DialogAdminEditEmailComponent', () => {
  let component: DialogAdminEditEmailComponent;
  let fixture: ComponentFixture<DialogAdminEditEmailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogAdminEditEmailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogAdminEditEmailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
