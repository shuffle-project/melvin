import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WaveformCaptionsComponent } from './waveform-captions.component';

describe('WaveformCaptionsComponent', () => {
  let component: WaveformCaptionsComponent;
  let fixture: ComponentFixture<WaveformCaptionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WaveformCaptionsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WaveformCaptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
