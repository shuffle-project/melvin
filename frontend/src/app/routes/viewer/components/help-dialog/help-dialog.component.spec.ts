import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HelpDialogComponent } from './help-dialog.component';

describe('HelptDialogComponent', () => {
  let component: HelpDialogComponent;
  let fixture: ComponentFixture<HelpDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HelpDialogComponent],
    });
    fixture = TestBed.createComponent(HelpDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
