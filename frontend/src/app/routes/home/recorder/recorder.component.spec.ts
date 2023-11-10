import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecorderComponent } from './recorder.component';

describe('RecorderComponent', () => {
  let component: RecorderComponent;
  let fixture: ComponentFixture<RecorderComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RecorderComponent]
    });
    fixture = TestBed.createComponent(RecorderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
