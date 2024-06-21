import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogProjectMediaComponent } from './dialog-project-media.component';

describe('DialogProjectMediaComponent', () => {
  let component: DialogProjectMediaComponent;
  let fixture: ComponentFixture<DialogProjectMediaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogProjectMediaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DialogProjectMediaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
