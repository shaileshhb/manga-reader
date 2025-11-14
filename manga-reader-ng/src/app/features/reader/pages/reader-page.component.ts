import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReaderStore } from '../stores/reader.store';
import { LibraryComponent } from '../components/library.component';
import { ReaderComponent } from '../components/reader.component';

@Component({
  selector: 'app-reader-page',
  standalone: true,
  imports: [CommonModule, LibraryComponent, ReaderComponent],
  template: `
    <ng-container *ngIf="store.showLibrary(); else reading">
      <app-library />
    </ng-container>
    <ng-template #reading>
      <app-reader />
    </ng-template>
  `,
})
export class ReaderPageComponent {
  store = inject(ReaderStore);
}


