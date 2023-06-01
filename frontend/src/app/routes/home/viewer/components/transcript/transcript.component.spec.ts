import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TranscriptComponent } from './transcript.component';

describe('TranscriptComponent', () => {
  let component: TranscriptComponent;
  let fixture: ComponentFixture<TranscriptComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TranscriptComponent]
    });
    fixture = TestBed.createComponent(TranscriptComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
