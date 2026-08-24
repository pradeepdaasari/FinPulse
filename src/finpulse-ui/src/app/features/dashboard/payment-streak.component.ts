import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { DashboardService } from '../../core/services/dashboard.service';
import { PaymentStreak } from '../../core/models/dashboard.model';

@Component({
  selector: 'app-payment-streak',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  template: `
    @if (streak()) {
      <mat-card class="streak-card">
        <mat-card-content>
          <div class="streak-content">
            <div class="streak-icon" aria-hidden="true">
              <mat-icon>local_fire_department</mat-icon>
            </div>
            <div class="streak-info">
              <span class="streak-count">{{ streak()!.currentStreak }}</span>
              <span class="streak-label">month streak</span>
            </div>
            <div class="streak-details">
              <div class="streak-detail">
                <span class="detail-value">{{ streak()!.longestStreak }}</span>
                <span class="detail-label">Best</span>
              </div>
              <div class="streak-detail">
                <mat-icon class="status-icon" [class.paid]="streak()!.currentMonthAllPaid">
                  {{ streak()!.currentMonthAllPaid ? 'check_circle' : 'pending' }}
                </mat-icon>
                <span class="detail-label">This Month</span>
              </div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    }
  `,
  styles: [`
    .streak-card {
      margin-top: var(--spacing-md);
    }
    .streak-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .streak-icon {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      background: rgba(234, 88, 12, 0.08);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .streak-icon mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
      color: var(--color-warning);
    }
    .streak-info {
      display: flex;
      flex-direction: column;
    }
    .streak-count {
      font-size: 2rem;
      font-weight: 700;
      color: var(--color-text);
      line-height: 1;
    }
    .streak-label {
      font-size: 0.8125rem;
      color: var(--color-text-secondary);
      font-weight: 500;
    }
    .streak-details {
      margin-left: auto;
      display: flex;
      gap: 24px;
    }
    .streak-detail {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
    }
    .detail-value {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--color-text);
    }
    .detail-label {
      font-size: 0.6875rem;
      color: var(--color-text-secondary);
      letter-spacing: 0.03em;
      font-weight: 600;
    }
    .status-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
      color: var(--color-text-secondary);
    }
    .status-icon.paid { color: var(--color-success); }
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
