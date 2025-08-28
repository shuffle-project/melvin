import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TiptapParagraphViewerComponent } from './tiptap-paragraph-viewer.component';

describe('TiptapParagraphComponent', () => {
  let component: TiptapParagraphViewerComponent;
  let fixture: ComponentFixture<TiptapParagraphViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TiptapParagraphViewerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TiptapParagraphViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
