import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CaptionTimeComponent } from './caption-time.component';

describe('CaptionTimeComponent', () => {
  let component: CaptionTimeComponent;
  let fixture: ComponentFixture<CaptionTimeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [CaptionTimeComponent]
})
    .compileComponents();

    fixture = TestBed.createComponent(CaptionTimeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
