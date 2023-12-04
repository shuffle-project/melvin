import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VideoPlayerMediaElementComponent } from './video-player-media-element.component';

describe('VideoPlayerMediaElementComponent', () => {
  let component: VideoPlayerMediaElementComponent;
  let fixture: ComponentFixture<VideoPlayerMediaElementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [VideoPlayerMediaElementComponent]
})
    .compileComponents();

    fixture = TestBed.createComponent(VideoPlayerMediaElementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
