import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CaptionComponent } from './caption.component';

describe('CaptionComponent', () => {
  let component: CaptionComponent;
  let fixture: ComponentFixture<CaptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CaptionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CaptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
