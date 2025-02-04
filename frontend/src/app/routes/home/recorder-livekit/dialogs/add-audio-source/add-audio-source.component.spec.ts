import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddAudioSourceComponent } from './add-audio-source.component';

describe('AddAudioSourceComponent', () => {
  let component: AddAudioSourceComponent;
  let fixture: ComponentFixture<AddAudioSourceComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [AddAudioSourceComponent]
});
    fixture = TestBed.createComponent(AddAudioSourceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
