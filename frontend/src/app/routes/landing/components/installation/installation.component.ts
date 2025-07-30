import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';

@Component({
  selector: 'app-installation',
  imports: [MatButtonModule, MatIconModule, MatTableModule],
  templateUrl: './installation.component.html',
  styleUrl: './installation.component.scss',
})
export class InstallationComponent {
  displayedColumns: string[] = ['component', 'requirement'];
  dataSource = [
    {
      component: $localize`:@@installationTableGPUComponent:GPU`,
      requirement: '16 GB VRAM',
      requirementDescription: $localize`:@@installationTableGPUDescription:CPU can be used for ASR, but is significantly slower.`,
    },
    {
      component: $localize`:@@installationTableCPUComponent:CPU`,
      requirement: $localize`:@@installationTableCPURequirement:8 cores / 16 threads`,
      requirementDescription: $localize`:@@installationTableCPUDescription:Melvin uses ffmpeg to convert videos. Having multiple CPU cores  available increases processing speed, particularly for long videos with  high resolution.`,
    },
    {
      component: $localize`:@@installationTableStorageComponent:Storage`,
      requirement: '2 TB SSD',
      requirementDescription: $localize`:@@installationTableStorageDescription:A one-hour video is approximately 1 GB in size`,
    },
    {
      component: $localize`:@@installationTableRAMComponent:RAM`,
      requirement: '16 GB',
    },
  ];
}
