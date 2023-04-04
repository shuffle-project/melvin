import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LiveControlsComponent } from './live-controls.component';

describe('LiveControlsComponent', () => {
  let component: LiveControlsComponent;
  let fixture: ComponentFixture<LiveControlsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LiveControlsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LiveControlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
