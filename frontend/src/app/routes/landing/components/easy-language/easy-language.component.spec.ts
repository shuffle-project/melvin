import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EasyLanguageComponent } from './easy-language.component';

describe('EasyLanguageComponent', () => {
  let component: EasyLanguageComponent;
  let fixture: ComponentFixture<EasyLanguageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EasyLanguageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EasyLanguageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
