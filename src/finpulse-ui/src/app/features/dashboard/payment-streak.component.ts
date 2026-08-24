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
            <div class="streak-icon">
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
      background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
      border: 1px solid #fed7aa;
    }
    .streak-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .streak-icon mat-icon {
      font-size: 36px;
      width: 36px;
      height: 36px;
      color: #ea580c;
    }
    .streak-info {
      display: flex;
      flex-direction: column;
    }
    .streak-count {
      font-size: 2rem;
      font-weight: 700;
      color: #c2410c;
      line-height: 1;
    }
    .streak-label {
      font-size: 0.8125rem;
      color: #9a3412;
      font-weight: 500;
    }
    .streak-details {
      margin-left: auto;
      display: flex;
      gap: 20px;
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
      color: #c2410c;
    }
    .detail-label {
      font-size: 0.6875rem;
      color: #9a3412;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .status-icon {
      font-size: 22px;
      width: 22px;
      height: 22px;
      color: #9a3412;
    }
    .status-icon.paid { color: #16a34a; }
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
