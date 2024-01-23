import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadInformationComponent } from './upload-information.component';

describe('UploadInformationComponent', () => {
  let component: UploadInformationComponent;
  let fixture: ComponentFixture<UploadInformationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadInformationComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UploadInformationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
