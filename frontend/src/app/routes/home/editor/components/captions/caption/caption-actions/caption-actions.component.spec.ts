import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CaptionActionsComponent } from './caption-actions.component';

describe('CaptionActionsComponent', () => {
  let component: CaptionActionsComponent;
  let fixture: ComponentFixture<CaptionActionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CaptionActionsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CaptionActionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
