import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogSpellcheckInfoComponent } from './dialog-spellcheck-info.component';

describe('DialogSpellcheckInfoComponent', () => {
  let component: DialogSpellcheckInfoComponent;
  let fixture: ComponentFixture<DialogSpellcheckInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogSpellcheckInfoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogSpellcheckInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
