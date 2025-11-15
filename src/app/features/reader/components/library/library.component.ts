import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReaderStore } from '../../stores/reader.store';
import { SimpleLoadingComponent } from '../simple-loading/simple-loading.component';

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [CommonModule, SimpleLoadingComponent],
  templateUrl: './library.component.html',
  styleUrls: ['./library.component.scss'],
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


