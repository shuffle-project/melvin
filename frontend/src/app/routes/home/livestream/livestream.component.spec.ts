import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LivestreamComponent } from './livestream.component';

describe('LivestreamComponent', () => {
  let component: LivestreamComponent;
  let fixture: ComponentFixture<LivestreamComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LivestreamComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LivestreamComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
