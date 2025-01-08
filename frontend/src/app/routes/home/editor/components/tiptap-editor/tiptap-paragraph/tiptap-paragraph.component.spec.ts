import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TiptapParagraphComponent } from './tiptap-paragraph.component';

describe('TiptapParagraphComponent', () => {
  let component: TiptapParagraphComponent;
  let fixture: ComponentFixture<TiptapParagraphComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TiptapParagraphComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TiptapParagraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
