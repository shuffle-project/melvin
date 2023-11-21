import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddVideoSourceComponent } from './add-video-source.component';

describe('AddVideoSourceComponent', () => {
  let component: AddVideoSourceComponent;
  let fixture: ComponentFixture<AddVideoSourceComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AddVideoSourceComponent]
    });
    fixture = TestBed.createComponent(AddVideoSourceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
