import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddScreensharingSourceComponent } from './add-screensharing-source.component';

describe('AddScreensharingSourceComponent', () => {
  let component: AddScreensharingSourceComponent;
  let fixture: ComponentFixture<AddScreensharingSourceComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [AddScreensharingSourceComponent]
});
    fixture = TestBed.createComponent(AddScreensharingSourceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
