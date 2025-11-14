import { Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReaderStore } from '../stores/reader.store';

@Component({
  selector: 'app-reader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="reader" (mousemove)="onMouseMove()" (click)="onClick($event)">
      <div class="topbar" [class.hidden]="!store.showControls()">
        <div class="row">
          <button class="btn back" (click)="back($event)">← <span class="d-sm">Library</span></button>
          <h2 class="title">{{ store.currentManga()?.name }}</h2>
          <div class="actions">
            <button class="btn" (click)="toggleView($event)">{{ store.viewMode() === 'single' ? '📄' : '📖' }}</button>
            <button class="btn" (click)="toggleFullscreen($event)">{{ store.isFullscreen() ? '⊡' : '⛶' }}</button>
          </div>
        </div>
      </div>

      <div class="nav left" [class.disabled]="store.currentPage() <= 0">
        <button class="btn circle" (click)="prev($event)">‹</button>
      </div>
      <div class="nav right" [class.disabled]="store.currentPage() >= store.pages().length - 1">
        <button class="btn circle" (click)="next($event)">›</button>
      </div>

      <div class="stage">
        <div class="stage-inner">
          <ng-container *ngIf="store.viewMode() === 'single'; else doubleView">
            <div class="page">
              <img #image [src]="store.pages()[store.currentPage()]?.url" [alt]="'Page ' + (store.currentPage() + 1)" [style.transform]="'scale(' + store.zoom() + ')'" draggable="false" />
            </div>
          </ng-container>
          <ng-template #doubleView>
            <div class="page double">
              <img *ngIf="store.currentPage() > 0" [src]="store.pages()[store.currentPage() - 1]?.url" [alt]="'Page ' + store.currentPage()" draggable="false" />
              <img [src]="store.pages()[store.currentPage()]?.url" [alt]="'Page ' + (store.currentPage() + 1)" draggable="false" />
            </div>
          </ng-template>
        </div>
      </div>

      <div class="bottombar" [class.hidden]="!store.showControls()">
        <div class="row">
          <div class="zoom">
            <button class="btn" (click)="zoomOut($event)">-</button>
            <span class="pill">{{ (store.zoom() * 100) | number:'1.0-0' }}%</span>
            <button class="btn" (click)="zoomIn($event)">+</button>
          </div>
          <div class="progress">
            <input type="range" [min]="1" [max]="Math.max(1, store.pages().length)" [value]="Math.min(store.pages().length, store.currentPage() + 1)" (click)="$event.stopPropagation()" (input)="onSeek($event)" />
            <span class="pill">{{ store.currentPage() + 1 }}/{{ store.pages().length }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .reader { position: fixed; inset: 0; background: #000; color: #fff; }
    .topbar, .bottombar {
      position: fixed; left: 0; right: 0; padding: 12px; transition: all .3s ease;
      background: linear-gradient(to bottom, rgba(0,0,0,.9), rgba(0,0,0,.6), transparent);
      border-bottom: 2px solid #dc2626;
      z-index: 50;
    }
    .topbar.hidden, .bottombar.hidden { transform: translateY(-100%); opacity: 0; }
    .bottombar { bottom: 0; top: auto; border-top: 2px solid #dc2626; border-bottom: none;
      background: linear-gradient(to top, rgba(0,0,0,.9), rgba(0,0,0,.6), transparent);
    }
    .row { display: flex; align-items: center; justify-content: space-between; gap: 8px; max-width: 960px; margin: 0 auto; }
    .title { margin: 0; font-size: 16px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 50vw; }
    .actions { display: flex; gap: 8px; }
    .btn { background: #1f2937; color: #fff; border: 1px solid #4b5563; border-radius: 8px; padding: 6px 10px; cursor: pointer; }
    .btn.back { background: #dc2626; border-color: #fff; font-weight: 700; }
    .btn.circle { width: 48px; height: 48px; border-radius: 9999px; border-width: 4px; border-color: #fff; background: #dc2626; font-size: 20px; }
    .nav { position: fixed; top: 50%; transform: translateY(-50%); z-index: 40; }
    .nav.left { left: 16px; } .nav.right { right: 16px; }
    .nav.disabled { opacity: .2; pointer-events: none; }
    .stage { height: 100%; display: flex; align-items: center; justify-content: center; padding: 8px 16px; }
    .stage-inner { position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
    .page { background: #fff; border: 4px solid #1f2937; border-radius: 12px; max-height: 92vh; max-width: 100%; overflow: hidden; }
    .page img { display: block; max-height: 92vh; max-width: 100%; object-fit: contain; user-select: none; }
    .page.double { display: flex; gap: 8px; padding: 8px; }
    .zoom { display: flex; align-items: center; gap: 8px; }
    .pill { background: #1f2937; border: 1px solid #4b5563; padding: 4px 8px; border-radius: 8px; }
    .progress { display: flex; align-items: center; gap: 8px; flex: 1; justify-content: flex-end; }
    input[type=range] { width: 160px; accent-color: #dc2626; }
    @media (min-width: 640px) { .title { max-width: 320px; } .d-sm { display: inline; } }
    @media (max-width: 639px) { .d-sm { display: none; } }
  `],
})
export class ReaderComponent {
  store = inject(ReaderStore);
  @ViewChild('image') imageRef?: ElementRef<HTMLImageElement>;

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


