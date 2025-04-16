import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TranscriptionMenuContentComponent } from './transcription-menu-content.component';

describe('TranscriptionMenuContentComponent', () => {
  let component: TranscriptionMenuContentComponent;
  let fixture: ComponentFixture<TranscriptionMenuContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TranscriptionMenuContentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TranscriptionMenuContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
