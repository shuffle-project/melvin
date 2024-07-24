import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-dialog-create-project',
  standalone: true,
  imports: [MatDialogModule, MatIconModule, MatButtonModule],
  templateUrl: './dialog-create-project.component.html',
  styleUrl: './dialog-create-project.component.scss',
})
export class DialogCreateProjectComponent {
  loading = false;

  onAddFiles(event: any) {}
}
