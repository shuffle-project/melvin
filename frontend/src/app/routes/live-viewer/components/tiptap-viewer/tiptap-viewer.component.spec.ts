import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TiptapViewerComponent } from './tiptap-viewer.component';

describe('TiptapViewerComponent', () => {
  let component: TiptapViewerComponent;
  let fixture: ComponentFixture<TiptapViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TiptapViewerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TiptapViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
