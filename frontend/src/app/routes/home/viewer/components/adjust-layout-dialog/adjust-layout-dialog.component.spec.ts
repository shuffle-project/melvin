import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdjustLayoutDialogComponent } from './adjust-layout-dialog.component';

describe('AdjustLayoutDialogComponent', () => {
  let component: AdjustLayoutDialogComponent;
  let fixture: ComponentFixture<AdjustLayoutDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AdjustLayoutDialogComponent]
    });
    fixture = TestBed.createComponent(AdjustLayoutDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
