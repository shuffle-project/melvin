import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CaptionHistoryModalComponent } from './caption-history-modal.component';

describe('CaptionHistoryModalComponent', () => {
  let component: CaptionHistoryModalComponent;
  let fixture: ComponentFixture<CaptionHistoryModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CaptionHistoryModalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CaptionHistoryModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
