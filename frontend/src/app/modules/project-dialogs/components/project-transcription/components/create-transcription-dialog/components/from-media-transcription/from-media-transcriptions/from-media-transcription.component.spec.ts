import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FromMediaTranscriptionComponent } from './from-media-transcription.component';

describe('FromMediaTranscriptionsComponent', () => {
  let component: FromMediaTranscriptionComponent;
  let fixture: ComponentFixture<FromMediaTranscriptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FromMediaTranscriptionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FromMediaTranscriptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
