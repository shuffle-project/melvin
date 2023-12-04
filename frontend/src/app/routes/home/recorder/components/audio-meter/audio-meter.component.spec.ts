import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AudioMeterComponent } from './audio-meter.component';

describe('AudioMeterComponent', () => {
  let component: AudioMeterComponent;
  let fixture: ComponentFixture<AudioMeterComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [AudioMeterComponent]
});
    fixture = TestBed.createComponent(AudioMeterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
