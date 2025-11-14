import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MangaItem, MangaService } from '../services/manga.service';
import { buildDownloadUrl, buildReadUrl } from '../../../core/utils/filename';

@Component({
  selector: 'app-manga-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="loading()" class="padded center muted">Loading manga…</div>
    <div *ngIf="error()" class="padded center">
      <p class="error">Unable to load manga right now.</p>
      <button type="button" (click)="reload()">Retry</button>
    </div>
    <div *ngIf="!loading() && !error() && !items().length" class="padded center muted">
      No manga available.
    </div>
    <div *ngIf="!loading() && !error() && items().length" class="grid">
      <div class="card" *ngFor="let item of items(); track item.id">
        <h3 [title]="item.name">{{ item.name }}</h3>
        <div class="meta">
          <span>{{ (item.size || 0) | number }} bytes</span>
        </div>
        <div class="actions">
          <a [href]="item.readUrl || readUrl(item)" target="_blank" rel="noopener noreferrer">Read</a>
          <a [href]="item.downloadUrl || downloadUrl(item)">Download</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .padded { padding: 16px; }
    .center { text-align: center; }
    .muted { color: #9ca3af; }
    .error { color: #ef4444; margin-bottom: 8px; }
    .grid {
      display: grid;
      grid-template-columns: repeat(1, minmax(0,1fr));
      gap: 16px;
      padding: 16px;
    }
    @media (min-width: 640px) {
      .grid { grid-template-columns: repeat(2, minmax(0,1fr)); }
    }
    @media (min-width: 1024px) {
      .grid { grid-template-columns: repeat(3, minmax(0,1fr)); }
    }
    .card {
      border: 1px solid #404040;
      border-radius: 12px;
      padding: 16px;
      background: rgba(0,0,0,0.4);
      color: #fff;
    }
    h3 {
      margin: 0;
      font-weight: 600;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .meta { margin-top: 4px; color: #9ca3af; font-size: 12px; }
    .actions { display: flex; gap: 8px; margin-top: 12px; }
    .actions a {
      padding: 6px 10px;
      border-radius: 8px;
      text-decoration: none;
      color: #fff;
      background: #1f2937;
    }
    .actions a:last-child { background: #dc2626; }
    .actions a:last-child:hover { background: #ef4444; }
  `],
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


