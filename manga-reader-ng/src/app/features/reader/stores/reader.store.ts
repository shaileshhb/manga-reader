import { Injectable, effect, signal } from '@angular/core';
import { CbzService, ExtractCbzResult } from '../services/cbz.service';

export type ViewMode = 'single' | 'double';

@Injectable({ providedIn: 'root' })
export class ReaderStore {
  // State
  darkMode = signal<boolean>(true);
  currentManga = signal<ExtractCbzResult['manga'] | null>(null);
  pages = signal<Array<{ name: string; url: string }>>([]);
  currentPage = signal<number>(0);
  zoom = signal<number>(1);
  mangaList = signal<Array<ExtractCbzResult['manga']>>([]);
  showLibrary = signal<boolean>(true);
  loading = signal<boolean>(false);
  dragOver = signal<boolean>(false);
  showControls = signal<boolean>(true);
  viewMode = signal<ViewMode>('single');
  isFullscreen = signal<boolean>(false);
  progress = signal<Record<string, { currentPage: number; lastRead: number }>>({});

  constructor(private readonly cbz: CbzService) {
    // Observe fullscreen changes
    effect(() => {
      const onFs = () => this.isFullscreen.set(!!document.fullscreenElement);
      document.addEventListener('fullscreenchange', onFs);
      return () => document.removeEventListener('fullscreenchange', onFs);
    });
  }

  async loadManga(file: File): Promise<void> {
    this.loading.set(true);
    try {
      const { images, manga } = await this.cbz.extractCbz(file);
      this.mangaList.set([...this.mangaList(), manga]);
      this.currentManga.set(manga);
      this.pages.set(images);
      const saved = this.progress()[manga.id];
      this.currentPage.set(saved?.currentPage ?? 0);
      this.showLibrary.set(false);
    } finally {
      this.loading.set(false);
    }
  }

  nextPage(): void {
    const increment = this.viewMode() === 'double' ? 2 : 1;
    const cp = this.currentPage();
    const total = this.pages().length;
    if (cp < total - increment) {
      const newPage = cp + increment;
      this.currentPage.set(newPage);
      const manga = this.currentManga();
      if (manga) {
        this.progress.set({
          ...this.progress(),
          [manga.id]: { currentPage: newPage, lastRead: Date.now() },
        });
      }
    }
  }

  prevPage(): void {
    const decrement = this.viewMode() === 'double' ? 2 : 1;
    const cp = this.currentPage();
    if (cp > 0) {
      const newPage = Math.max(0, cp - decrement);
      this.currentPage.set(newPage);
      const manga = this.currentManga();
      if (manga) {
        this.progress.set({
          ...this.progress(),
          [manga.id]: { currentPage: newPage, lastRead: Date.now() },
        });
      }
    }
  }

  removeManga(mangaId: string): void {
    this.mangaList.set(this.mangaList().filter((m) => m.id !== mangaId));
    const next = { ...this.progress() };
    delete next[mangaId];
    this.progress.set(next);
  }
}


