import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VideoControlsComponent } from './video-controls.component';

describe('VideoControlsComponent', () => {
  let component: VideoControlsComponent;
  let fixture: ComponentFixture<VideoControlsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VideoControlsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VideoControlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
