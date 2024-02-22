import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FromMediaTranscriptionsComponent } from './from-media-transcriptions.component';

describe('FromMediaTranscriptionsComponent', () => {
  let component: FromMediaTranscriptionsComponent;
  let fixture: ComponentFixture<FromMediaTranscriptionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FromMediaTranscriptionsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FromMediaTranscriptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
