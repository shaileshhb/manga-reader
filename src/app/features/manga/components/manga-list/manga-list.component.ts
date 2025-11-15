import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MangaItem, MangaService } from '../../services/manga.service';
import { buildDownloadUrl, buildReadUrl } from '../../../../core/utils/filename';

@Component({
  selector: 'app-manga-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './manga-list.component.html',
  styleUrls: ['./manga-list.component.scss'],
})
export class MangaListComponent {
  private readonly service = inject(MangaService);

  items = signal<MangaItem[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  constructor() {
    this.load();
  }

  readUrl(item: MangaItem) {
    return buildReadUrl(item.id);
  }
  downloadUrl(item: MangaItem) {
    return buildDownloadUrl(item.id, item.name);
  }

  reload = () => this.load();

  private load() {
    this.loading.set(true);
    this.error.set(null);
    this.service.getAllManga().subscribe({
      next: (data) => {
        this.items.set(Array.isArray(data) ? data : []);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Unable to load manga right now.');
        this.loading.set(false);
      },
    });
  }
}



