import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShortcutsComponent } from './shortcuts.component';

describe('ShortCutsComponent', () => {
  let component: ShortcutsComponent;
  let fixture: ComponentFixture<ShortcutsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShortcutsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ShortcutsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
