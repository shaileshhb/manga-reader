import { Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReaderStore } from '../../stores/reader.store';

@Component({
  selector: 'app-reader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reader.component.html',
  styleUrls: ['./reader.component.scss'],
})
export class ReaderComponent {
  store = inject(ReaderStore);
  @ViewChild('image') imageRef?: ElementRef<HTMLImageElement>;

  get totalPages(): number {
    return Math.max(1, this.store.pages().length);
  }
  get currentPageDisplay(): number {
    return Math.min(this.store.pages().length, this.store.currentPage() + 1);
  }

  onMouseMove() {
    this.store.showControls.set(true);
  }
  onClick(e: MouseEvent) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pos = clickX / rect.width;
    if (pos > 0.7) this.store.nextPage();
    else if (pos < 0.3) this.store.prevPage();
    else this.store.showControls.set(!this.store.showControls());
  }

  back(e: MouseEvent) {
    e.stopPropagation();
    this.store.showLibrary.set(true);
  }
  toggleView(e: MouseEvent) {
    e.stopPropagation();
    this.store.viewMode.set(this.store.viewMode() === 'single' ? 'double' : 'single');
  }
  toggleFullscreen(e: MouseEvent) {
    e.stopPropagation();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }
  prev(e: MouseEvent) { e.stopPropagation(); this.store.prevPage(); }
  next(e: MouseEvent) { e.stopPropagation(); this.store.nextPage(); }
  zoomOut(e: MouseEvent) { e.stopPropagation(); this.store.zoom.set(Math.max(0.5, this.store.zoom() - 0.25)); }
  zoomIn(e: MouseEvent) { e.stopPropagation(); this.store.zoom.set(Math.min(3, this.store.zoom() + 0.25)); }
  onSeek(e: Event) {
    const input = e.target as HTMLInputElement;
    const page = Number(input.value) - 1;
    this.store.currentPage.set(page);
  }
}


