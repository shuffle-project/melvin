import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadAdditionalContentComponent } from './upload-additional-content.component';

describe('UploadAdditionalVideoComponent', () => {
  let component: UploadAdditionalContentComponent;
  let fixture: ComponentFixture<UploadAdditionalContentComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [UploadAdditionalContentComponent],
});
    fixture = TestBed.createComponent(UploadAdditionalContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
