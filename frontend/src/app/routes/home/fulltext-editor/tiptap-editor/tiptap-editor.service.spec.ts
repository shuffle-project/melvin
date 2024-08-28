import { TestBed } from '@angular/core/testing';

import { TiptapEditorService } from './tiptap-editor.service';

describe('TiptapEditorService', () => {
  let service: TiptapEditorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TiptapEditorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
