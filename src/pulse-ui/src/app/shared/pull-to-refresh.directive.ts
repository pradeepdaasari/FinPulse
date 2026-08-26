import { Directive, ElementRef, output, inject, OnInit, OnDestroy, NgZone } from '@angular/core';

@Directive({
  selector: '[appPullToRefresh]',
  standalone: true
})
export class PullToRefreshDirective implements OnInit, OnDestroy {
  refresh = output<void>();

  private el = inject(ElementRef);
  private zone = inject(NgZone);
  private startY = 0;
  private currentY = 0;
  private pulling = false;
  private threshold = 70;
  private indicator: HTMLElement | null = null;

  private touchStartHandler = (e: TouchEvent) => this.onTouchStart(e);
  private touchMoveHandler = (e: TouchEvent) => this.onTouchMove(e);
  private touchEndHandler = () => this.onTouchEnd();

  ngOnInit(): void {
    this.zone.runOutsideAngular(() => {
      const el = this.el.nativeElement;
      el.addEventListener('touchstart', this.touchStartHandler, { passive: true });
      el.addEventListener('touchmove', this.touchMoveHandler, { passive: false });
      el.addEventListener('touchend', this.touchEndHandler, { passive: true });
    });
  }

  ngOnDestroy(): void {
    const el = this.el.nativeElement;
    el.removeEventListener('touchstart', this.touchStartHandler);
    el.removeEventListener('touchmove', this.touchMoveHandler);
    el.removeEventListener('touchend', this.touchEndHandler);
    this.removeIndicator();
  }

  private onTouchStart(e: TouchEvent): void {
    const scrollEl = this.getScrollParent();
    if (scrollEl && scrollEl.scrollTop > 0) return;
    this.startY = e.touches[0].clientY;
    this.pulling = true;
  }

  private onTouchMove(e: TouchEvent): void {
    if (!this.pulling) return;
    this.currentY = e.touches[0].clientY;
    const distance = this.currentY - this.startY;

    if (distance < 0) {
      this.pulling = false;
      this.removeIndicator();
      return;
    }

    if (distance > 10) {
      e.preventDefault();
      const progress = Math.min(distance / this.threshold, 1);
      this.showIndicator(progress, distance);
    }
  }

  private onTouchEnd(): void {
    if (!this.pulling) return;
    const distance = this.currentY - this.startY;
    this.pulling = false;

    if (distance >= this.threshold) {
      this.zone.run(() => this.refresh.emit());
    }

    this.removeIndicator();
  }

  private showIndicator(progress: number, distance: number): void {
    if (!this.indicator) {
      this.indicator = document.createElement('div');
      this.indicator.className = 'ptr-indicator';
      this.indicator.innerHTML = `<div class="ptr-spinner"></div>`;
      this.indicator.style.cssText = `
        position: fixed; top: 60px; left: 50%; transform: translateX(-50%);
        width: 36px; height: 36px; border-radius: 50%;
        background: var(--color-surface); box-shadow: var(--shadow-md);
        display: flex; align-items: center; justify-content: center;
        z-index: 1001; opacity: 0; transition: opacity 0.15s;
      `;
      const spinner = this.indicator.querySelector('.ptr-spinner') as HTMLElement;
      spinner.style.cssText = `
        width: 20px; height: 20px; border: 2.5px solid var(--color-border);
        border-top-color: var(--color-primary); border-radius: 50%;
      `;
      document.body.appendChild(this.indicator);
    }

    this.indicator.style.opacity = String(progress);
    const spinner = this.indicator.querySelector('.ptr-spinner') as HTMLElement;
    spinner.style.transform = `rotate(${progress * 360}deg)`;
  }

  private removeIndicator(): void {
    if (this.indicator) {
      this.indicator.remove();
      this.indicator = null;
    }
  }

  private getScrollParent(): Element | null {
    let el: Element | null = this.el.nativeElement;
    while (el) {
      if (el.scrollTop > 0 || el.classList.contains('mat-sidenav-content')) return el;
      el = el.parentElement;
    }
    return null;
  }
}
