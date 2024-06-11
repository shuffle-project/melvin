import { Routes } from '@angular/router';
import { FulltextEditorComponent } from '../fulltext-editor/fulltext-editor.component';
import { EditorComponent } from './editor.component';

export const EditorRoutes: Routes = [
  {
    path: ':id',
    component: EditorComponent,
  },

  {
    path: ':id/fulltext',
    component: FulltextEditorComponent,
  },
];

// @NgModule({
//   imports: [RouterModule.forChild(routes)],
//   exports: [RouterModule],
// })
// export class EditorRoutingModule {}
