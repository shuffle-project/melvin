import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmptyFileTranscriptionComponent } from './empty-file-transcription.component';

describe('EmptyFileTranscriptionComponent', () => {
  let component: EmptyFileTranscriptionComponent;
  let fixture: ComponentFixture<EmptyFileTranscriptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmptyFileTranscriptionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EmptyFileTranscriptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
