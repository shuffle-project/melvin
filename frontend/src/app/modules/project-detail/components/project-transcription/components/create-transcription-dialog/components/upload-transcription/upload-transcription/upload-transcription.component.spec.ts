import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadTranscriptionComponent } from './upload-transcription.component';

describe('UploadTranscriptionComponent', () => {
  let component: UploadTranscriptionComponent;
  let fixture: ComponentFixture<UploadTranscriptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadTranscriptionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UploadTranscriptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
