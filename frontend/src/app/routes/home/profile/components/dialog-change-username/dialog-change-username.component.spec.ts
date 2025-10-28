import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogChangeUsernameComponent } from './dialog-change-username.component';

describe('DialogChangeUsernameComponent', () => {
  let component: DialogChangeUsernameComponent;
  let fixture: ComponentFixture<DialogChangeUsernameComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogChangeUsernameComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DialogChangeUsernameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
