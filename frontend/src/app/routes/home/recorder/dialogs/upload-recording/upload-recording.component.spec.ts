import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadRecordingComponent } from './upload-recording.component';

describe('UploadRecordingComponent', () => {
  let component: UploadRecordingComponent;
  let fixture: ComponentFixture<UploadRecordingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadRecordingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UploadRecordingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
