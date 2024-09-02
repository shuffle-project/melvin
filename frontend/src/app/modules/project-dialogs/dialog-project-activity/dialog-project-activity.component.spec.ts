import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogProjectActivityComponent } from './dialog-project-activity.component';

describe('DialogProjectActivityComponent', () => {
  let component: DialogProjectActivityComponent;
  let fixture: ComponentFixture<DialogProjectActivityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogProjectActivityComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DialogProjectActivityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
