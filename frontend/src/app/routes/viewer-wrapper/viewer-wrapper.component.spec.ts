import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewerWrapperComponent } from './viewer-wrapper.component';

describe('ViewerWrapperComponent', () => {
  let component: ViewerWrapperComponent;
  let fixture: ComponentFixture<ViewerWrapperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewerWrapperComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ViewerWrapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
