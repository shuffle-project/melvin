import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TiptapEditorComponent } from './tiptap-editor.component';

describe('TiptapEditorComponent', () => {
  let component: TiptapEditorComponent;
  let fixture: ComponentFixture<TiptapEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TiptapEditorComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TiptapEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
