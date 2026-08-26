import { Component, input } from '@angular/core';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  template: `
    @switch (type()) {
      @case ('card') {
        @for (i of items(); track i) {
          <div class="skeleton-card">
            <div class="skeleton-line h-lg w-40"></div>
            <div class="skeleton-line h-sm w-70"></div>
            <div class="skeleton-line h-sm w-55"></div>
          </div>
        }
      }
      @case ('dashboard') {
        <div class="skeleton-dashboard">
          <div class="skeleton-panel"></div>
          <div class="skeleton-grid">
            <div class="skeleton-card tall"></div>
            <div class="skeleton-card tall"></div>
          </div>
          <div class="skeleton-card wide"></div>
          <div class="skeleton-grid">
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
          </div>
        </div>
      }
      @case ('table') {
        <div class="skeleton-table">
          <div class="skeleton-table-header">
            <div class="skeleton-line h-sm w-15"></div>
            <div class="skeleton-line h-sm w-20"></div>
            <div class="skeleton-line h-sm w-15"></div>
            <div class="skeleton-line h-sm w-10"></div>
          </div>
          @for (i of items(); track i) {
            <div class="skeleton-table-row">
              <div class="skeleton-line h-md w-25"></div>
              <div class="skeleton-line h-md w-15"></div>
              <div class="skeleton-line h-md w-20"></div>
              <div class="skeleton-line h-md w-10"></div>
            </div>
          }
        </div>
      }
      @case ('chart') {
        <div class="skeleton-card chart">
          <div class="skeleton-line h-lg w-30"></div>
          <div class="skeleton-chart-area"></div>
        </div>
      }
      @case ('list') {
        @for (i of items(); track i) {
          <div class="skeleton-list-item">
            <div class="skeleton-circle"></div>
            <div class="skeleton-list-text">
              <div class="skeleton-line h-md w-60"></div>
              <div class="skeleton-line h-sm w-40"></div>
            </div>
          </div>
        }
      }
      @default {
        @for (i of items(); track i) {
          <div class="skeleton-line h-md w-full"></div>
        }
      }
    }
  `,
  styles: [`
    :host { display: block; }

    .skeleton-line, .skeleton-card, .skeleton-circle, .skeleton-chart-area,
    .skeleton-panel, .skeleton-table-header, .skeleton-table-row, .skeleton-list-item {
      background: var(--color-skeleton, rgba(0, 0, 0, 0.06));
      border-radius: var(--radius-sm);
      animation: skeleton-pulse 1.5s ease-in-out infinite;
    }

    .skeleton-line {
      border-radius: 6px;
      margin-bottom: 10px;
      &.h-sm { height: 12px; }
      &.h-md { height: 16px; }
      &.h-lg { height: 24px; }
      &.w-10 { width: 10%; }
      &.w-15 { width: 15%; }
      &.w-20 { width: 20%; }
      &.w-25 { width: 25%; }
      &.w-30 { width: 30%; }
      &.w-40 { width: 40%; }
      &.w-55 { width: 55%; }
      &.w-60 { width: 60%; }
      &.w-70 { width: 70%; }
      &.w-full { width: 100%; }
    }

    .skeleton-card {
      padding: 20px;
      border-radius: var(--radius-md, 14px);
      min-height: 120px;
      margin-bottom: 16px;
      &.tall { min-height: 280px; }
      &.wide { min-height: 200px; }
      &.chart { min-height: 320px; }
    }

    .skeleton-dashboard {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .skeleton-panel {
      height: 180px;
      border-radius: var(--radius-md, 14px);
    }

    .skeleton-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      @media (max-width: 900px) {
        grid-template-columns: 1fr;
      }
    }

    .skeleton-table {
      border-radius: var(--radius-md, 14px);
      overflow: hidden;
    }

    .skeleton-table-header {
      display: flex;
      gap: 16px;
      padding: 16px 20px;
      opacity: 0.5;
    }

    .skeleton-table-row {
      display: flex;
      gap: 16px;
      padding: 14px 20px;
      background: transparent;
      border-top: 1px solid var(--color-border, rgba(0,0,0,0.06));
      animation: none;
      .skeleton-line { animation: skeleton-pulse 1.5s ease-in-out infinite; }
    }

    .skeleton-circle {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .skeleton-list-item {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 12px 0;
      background: transparent;
      animation: none;
      .skeleton-circle, .skeleton-line {
        animation: skeleton-pulse 1.5s ease-in-out infinite;
      }
    }

    .skeleton-list-text {
      flex: 1;
    }

    .skeleton-chart-area {
      margin-top: 16px;
      height: 200px;
      border-radius: var(--radius-sm, 10px);
      opacity: 0.6;
    }

    @keyframes skeleton-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
  `]
})
export class SkeletonLoaderComponent {
  type = input<'card' | 'dashboard' | 'table' | 'chart' | 'list' | 'line'>('card');
  count = input(3);

  items() {
    return Array.from({ length: this.count() }, (_, i) => i);
  }
}
