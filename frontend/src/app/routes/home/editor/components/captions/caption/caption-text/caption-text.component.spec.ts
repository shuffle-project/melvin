import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CaptionTextComponent } from './caption-text.component';

describe('CaptionTextComponent', () => {
  let component: CaptionTextComponent;
  let fixture: ComponentFixture<CaptionTextComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CaptionTextComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CaptionTextComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
