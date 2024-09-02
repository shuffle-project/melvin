import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CopyTranscriptionComponent } from './copy-transcription.component';

describe('CopyTranscriptionComponent', () => {
  let component: CopyTranscriptionComponent;
  let fixture: ComponentFixture<CopyTranscriptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CopyTranscriptionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CopyTranscriptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
