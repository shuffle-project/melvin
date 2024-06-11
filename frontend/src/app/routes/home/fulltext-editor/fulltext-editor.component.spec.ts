import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FulltextEditorComponent } from './fulltext-editor.component';

describe('FulltextEditorComponent', () => {
  let component: FulltextEditorComponent;
  let fixture: ComponentFixture<FulltextEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FulltextEditorComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FulltextEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
