import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LanguageAutocompleteComponent } from './language-autocomplete.component';

describe('LanguageAutocompleteComponent', () => {
  let component: LanguageAutocompleteComponent;
  let fixture: ComponentFixture<LanguageAutocompleteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LanguageAutocompleteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LanguageAutocompleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
