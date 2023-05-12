import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewSelectionComponent } from './view-selection.component';

describe('ViewSelectionComponent', () => {
  let component: ViewSelectionComponent;
  let fixture: ComponentFixture<ViewSelectionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ViewSelectionComponent]
    });
    fixture = TestBed.createComponent(ViewSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
