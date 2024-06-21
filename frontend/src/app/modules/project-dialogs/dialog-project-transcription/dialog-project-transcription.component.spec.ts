import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogProjectTranscriptionComponent } from './dialog-project-transcription.component';

describe('DialogProjectTranscriptionComponent', () => {
  let component: DialogProjectTranscriptionComponent;
  let fixture: ComponentFixture<DialogProjectTranscriptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogProjectTranscriptionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DialogProjectTranscriptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
