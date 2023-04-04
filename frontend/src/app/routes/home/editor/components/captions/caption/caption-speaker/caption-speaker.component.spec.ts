import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CaptionSpeakerComponent } from './caption-speaker.component';

describe('CaptionSpeakerComponent', () => {
  let component: CaptionSpeakerComponent;
  let fixture: ComponentFixture<CaptionSpeakerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CaptionSpeakerComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CaptionSpeakerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
