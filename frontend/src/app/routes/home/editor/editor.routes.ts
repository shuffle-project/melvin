import { Routes } from '@angular/router';
import { FulltextEditorComponent } from '../fulltext-editor/fulltext-editor.component';
import { EditorComponent } from './editor.component';

export const EditorRoutes: Routes = [
  {
    path: ':id/edit',
    component: FulltextEditorComponent,
  },
  {
    path: ':id/legacy',
    component: EditorComponent,
  },
];

// @NgModule({
//   imports: [RouterModule.forChild(routes)],
//   exports: [RouterModule],
// })
// export class EditorRoutingModule {}
