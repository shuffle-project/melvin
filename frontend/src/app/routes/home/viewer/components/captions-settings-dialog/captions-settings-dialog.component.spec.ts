import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CaptionsSettingsDialogComponent } from './captions-settings-dialog.component';

describe('CaptionsSettingsDialogComponent', () => {
  let component: CaptionsSettingsDialogComponent;
  let fixture: ComponentFixture<CaptionsSettingsDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CaptionsSettingsDialogComponent]
    });
    fixture = TestBed.createComponent(CaptionsSettingsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
