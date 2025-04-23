import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadProgressComponent } from './upload-progress.component';

describe('UploadProgressComponent', () => {
  let component: UploadProgressComponent;
  let fixture: ComponentFixture<UploadProgressComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadProgressComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UploadProgressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
