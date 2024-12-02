import { Routes } from '@angular/router';
import { FulltextEditorComponent } from '../fulltext-editor/fulltext-editor.component';

export const EditorRoutes: Routes = [
  {
    path: ':id',
    component: FulltextEditorComponent,
  },
];
