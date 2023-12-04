import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CaptionDeleteConfirmModalComponent } from './caption-delete-confirm-modal.component';

describe('CaptionDeleteConfirmModalComponent', () => {
  let component: CaptionDeleteConfirmModalComponent;
  let fixture: ComponentFixture<CaptionDeleteConfirmModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [CaptionDeleteConfirmModalComponent]
})
    .compileComponents();

    fixture = TestBed.createComponent(CaptionDeleteConfirmModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
