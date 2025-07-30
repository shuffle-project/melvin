import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LandingBackLinkComponent } from './landing-back-link.component';

describe('LandingBackLinkComponent', () => {
  let component: LandingBackLinkComponent;
  let fixture: ComponentFixture<LandingBackLinkComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingBackLinkComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LandingBackLinkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
