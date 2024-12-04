import { Routes } from '@angular/router';
import { EditorComponent } from './editor.component';

export const EditorRoutes: Routes = [
  {
    path: ':id',
    component: EditorComponent,
  },
];
