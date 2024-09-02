import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslateTranscriptionComponent } from './translate-transcription.component';

describe('TranslateTranscriptionComponent', () => {
  let component: TranslateTranscriptionComponent;
  let fixture: ComponentFixture<TranslateTranscriptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TranslateTranscriptionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TranslateTranscriptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
