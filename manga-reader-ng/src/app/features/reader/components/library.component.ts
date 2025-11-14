import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReaderStore } from '../stores/reader.store';
import { SimpleLoadingComponent } from './simple-loading.component';

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [CommonModule, SimpleLoadingComponent],
  template: `
    <div class="library" (drop)="onDrop($event)" (dragover)="onDragOver($event)" (dragleave)="onDragLeave($event)">
      <div class="topbar">
        <div class="wrap">
          <div class="brand">
            <div class="logo">漫</div>
            <div class="titles">
              <h1>MANGA READER</h1>
              <p>マンガリーダー</p>
            </div>
          </div>
          <button class="btn" (click)="toggleDark()">{{ store.darkMode() ? '☀️' : '🌙' }}</button>
        </div>
      </div>

      <div class="content">
        <div class="drop" [class.drag]="store.dragOver()">
          <div class="emoji">📖</div>
          <h2>START READING!</h2>
          <p class="muted">Drop your CBZ file or click to browse</p>
          <label class="choose">
            <input type="file" accept=".cbz" (change)="onFile($event)" hidden />
            <span>CHOOSE FILE</span>
          </label>
        </div>

        <div class="library-list" *ngIf="store.mangaList().length > 0">
          <h3>YOUR LIBRARY</h3>
          <div class="grid">
            <div class="item" *ngFor="let manga of store.mangaList(); track manga.id" (click)="openManga(manga.id)">
              <div class="icon">📚</div>
              <div class="meta">
                <div class="name">{{ manga.name }}</div>
                <div class="sub">
                  <span>{{ manga.pages }} pages</span>
                </div>
              </div>
              <button class="del" (click)="remove(manga.id, $event)">✕</button>
            </div>
          </div>
        </div>
      </div>

      <app-simple-loading *ngIf="store.loading()" />
    </div>
  `,
  styles: [`
    .library { min-height: 100vh; background: #000; color: #fff; }
    .topbar { position: fixed; left: 0; right: 0; top: 0; backdrop-filter: blur(8px); background: rgba(0,0,0,0.8); border-bottom: 4px solid #dc2626; z-index: 40; }
    .wrap { max-width: 1120px; margin: 0 auto; padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; }
    .brand { display: flex; align-items: center; gap: 12px; }
    .logo { width: 40px; height: 40px; background: linear-gradient(135deg,#dc2626,#991b1b); border-radius: 8px; display: flex; align-items: center; justify-content: center; border: 2px solid #fca5a5; transform: rotate(-6deg); font-size: 20px; }
    .titles h1 { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: .04em; }
    .titles p { margin: 0; color: #f87171; font-size: 10px; letter-spacing: .2em; }
    .btn { padding: 10px; border-radius: 10px; background: #dc2626; color: #fff; border: 2px solid #ef9a9a; cursor: pointer; }

    .content { padding: 112px 16px 32px; max-width: 1120px; margin: 0 auto; }
    .drop { border: 8px solid #fff; border-radius: 24px; padding: 48px 24px; text-align: center; background: radial-gradient(circle at 20% 50%, rgba(220,38,38,.15), transparent 50%), radial-gradient(circle at 80% 80%, rgba(220,38,38,.15), transparent 50%), linear-gradient(135deg,#7f1d1d,#000); transition: transform .2s ease, border-color .2s ease; }
    .drop.drag { border-color: #ef4444; transform: scale(1.02); }
    .emoji { font-size: 64px; margin-bottom: 12px; }
    h2 { margin: 0 0 8px; font-size: 28px; font-weight: 900; }
    .muted { color: #9ca3af; }
    .choose { display: inline-block; margin-top: 16px; }
    .choose span { background: #fff; color: #b91c1c; font-weight: 900; padding: 12px 16px; border-radius: 12px; border: 4px solid #000; display: inline-block; cursor: pointer; }

    .library-list { margin-top: 32px; }
    .library-list h3 { font-size: 24px; font-weight: 900; margin: 0 0 12px; text-shadow: 2px 2px 0 rgba(220,38,38,1); }
    .grid { display: grid; grid-template-columns: repeat(1, minmax(0,1fr)); gap: 16px; }
    @media (min-width: 640px) { .grid { grid-template-columns: repeat(2, minmax(0,1fr)); } }
    @media (min-width: 1024px) { .grid { grid-template-columns: repeat(3, minmax(0,1fr)); } }
    .item { position: relative; background: #000; border: 4px solid #fff; border-radius: 16px; padding: 16px; transform: rotate(-1deg); cursor: pointer; }
    .item .icon { font-size: 28px; }
    .item .meta { margin-top: 8px; }
    .item .name { font-weight: 700; }
    .item .sub { color: #9ca3af; font-size: 12px; }
    .item .del { position: absolute; right: 8px; top: 8px; border: 2px solid #fff; background: #dc2626; color: #fff; border-radius: 8px; padding: 4px 6px; }
  `],
})
export class LibraryComponent {
  store = inject(ReaderStore);

  toggleDark() {
    this.store.darkMode.set(!this.store.darkMode());
  }

  async onFile(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files && input.files[0];
    if (file) await this.store.loadManga(file);
  }

  onDrop(e: DragEvent) {
    e.preventDefault();
    this.store.dragOver.set(false);
    const files = Array.from(e.dataTransfer?.files || []);
    const cbz = files.find((f) => f.name.toLowerCase().endsWith('.cbz'));
    if (cbz) this.store.loadManga(cbz);
  }
  onDragOver(e: DragEvent) { e.preventDefault(); this.store.dragOver.set(true); }
  onDragLeave(e: DragEvent) { e.preventDefault(); this.store.dragOver.set(false); }

  openManga(mangaId: string) {
    const m = this.store.mangaList().find((x) => x.id === mangaId);
    if (m) {
      this.store.currentManga.set(m);
      this.store.showLibrary.set(false);
    }
  }
  remove(mangaId: string, e: MouseEvent) { e.stopPropagation(); this.store.removeManga(mangaId); }
}


