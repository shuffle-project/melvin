import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

interface SupportingDocument {
  title: string;
  download: {
    germanLink: string;
    englishLink: string;
  };
}

const SUPPORTING_DOCUMENTS_DATA: SupportingDocument[] = [
  {
    title: $localize`:@@guideSupportingDocumentTipsAccessibleTools:Tips for Accessible Tools`,
    download: {
      germanLink:
        'assets/landing/guide/Tipps_fuer_barrierfreie_Tools_SHUFFLE.pdf',
      englishLink: 'assets/landing/guide/Tips_for_Accessible_Tools_SHUFFLE.pdf',
    },
  },
];
@Component({
  selector: 'app-guide',
  imports: [RouterLink, MatTableModule, MatButtonModule],
  templateUrl: './guide.component.html',
  styleUrl: './guide.component.scss',
})
export class GuideComponent {
  supportingDocumentsColumns: string[] = ['title', 'download'];
  supportingDocumentsData = SUPPORTING_DOCUMENTS_DATA;
  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.router.events.subscribe(() => {
      const fragment = this.route.snapshot.fragment;
      if (fragment) {
        const element = document.getElementById(fragment);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    });
  }
}
