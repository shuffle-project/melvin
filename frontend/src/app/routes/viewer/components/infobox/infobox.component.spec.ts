import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfoboxComponent } from './infobox.component';

describe('InfoboxComponent', () => {
  let component: InfoboxComponent;
  let fixture: ComponentFixture<InfoboxComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [InfoboxComponent]
});
    fixture = TestBed.createComponent(InfoboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
