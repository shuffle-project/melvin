import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlainLanguageComponent } from './plain-language.component';

describe('PlainLanguageComponent', () => {
  let component: PlainLanguageComponent;
  let fixture: ComponentFixture<PlainLanguageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlainLanguageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PlainLanguageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
