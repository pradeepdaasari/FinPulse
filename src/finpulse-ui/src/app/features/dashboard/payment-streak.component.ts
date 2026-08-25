import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { DashboardService } from '../../core/services/dashboard.service';
import { PaymentStreak } from '../../core/models/dashboard.model';

@Component({
  selector: 'app-payment-streak',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    @if (streak() && streak()!.currentStreak > 0) {
      <div class="streak-bar">
        <div class="streak-left">
          <mat-icon class="fire-icon">local_fire_department</mat-icon>
          <span class="streak-count">{{ streak()!.currentStreak }}</span>
          <span class="streak-label">month payment streak</span>
          @if (streak()!.currentStreak >= 6) {
            <span class="streak-badge">{{ streak()!.currentStreak >= 12 ? '1yr+' : '6mo+' }}</span>
          }
        </div>
        <div class="streak-right">
          <span class="streak-best">Best: {{ streak()!.longestStreak }}</span>
          <mat-icon class="status-icon" [class.paid]="streak()!.currentMonthAllPaid">
            {{ streak()!.currentMonthAllPaid ? 'check_circle' : 'radio_button_unchecked' }}
          </mat-icon>
          <span class="status-text">{{ streak()!.currentMonthAllPaid ? 'Paid' : 'Pending' }}</span>
        </div>
      </div>
    }
  `,
  styles: [`
    .streak-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 16px;
      margin-top: var(--spacing-md);
      background: var(--color-surface);
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm);
    }
    .streak-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .fire-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: #EA580C;
    }
    .streak-count {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--color-text);
    }
    .streak-label {
      font-size: var(--text-sm);
      color: var(--color-text-secondary);
      font-weight: 500;
    }
    .streak-badge {
      font-size: 0.6rem;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: var(--radius-full);
      background: var(--color-warning-bg);
      color: #EA580C;
      text-transform: uppercase;
    }
    .streak-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .streak-best {
      font-size: var(--text-xs);
      color: var(--color-text-muted);
      font-weight: 500;
    }
    .status-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: var(--color-text-muted);
    }
    .status-icon.paid { color: var(--color-success); }
    .status-text {
      font-size: var(--text-xs);
      font-weight: 600;
      color: var(--color-text-secondary);
    }
    @media (max-width: 480px) {
      .streak-label { display: none; }
    }
  `]
})
export class PaymentStreakComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  streak = signal<PaymentStreak | null>(null);

  ngOnInit(): void {
    this.dashboardService.getStreak().subscribe(data => {
      this.streak.set(data);
    });
  }
}
