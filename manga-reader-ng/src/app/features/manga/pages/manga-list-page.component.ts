import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MangaListComponent } from '../components/manga-list.component';

@Component({
  selector: 'app-manga-list-page',
  standalone: true,
  imports: [CommonModule, MangaListComponent],
  template: `
    <div class="page">
      <div class="container">
        <h1>Manga Library</h1>
        <app-manga-list />
      </div>
    </div>
  `,
  styles: [`
    .page { min-height: 100vh; background: #000; }
    .container { max-width: 1024px; margin: 0 auto; padding: 32px 16px; }
    h1 { color: #fff; margin: 0 0 16px; font-size: 24px; font-weight: 700; }
  `],
})
export class MangaListPageComponent {}


