import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TradingService } from '../../core/services/trading.service';
import { TradingStats, TradingWisdom, WeeklyFocus, PreMarketNote } from '../../core/models/trading.model';

@Component({
  selector: 'app-trading-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonModule, MatIconModule, CurrencyPipe],
  template: `
    <div class="dashboard-banner">
      <div class="banner-pattern"></div>
      <div class="banner-content">
        <div class="banner-icon"><mat-icon>candlestick_chart</mat-icon></div>
        <h2>Trading Hub</h2>
        <p class="banner-subtitle">Discipline is your edge. Process over profit.</p>
      </div>
    </div>

    <!-- Daily Wisdom -->
    @if (wisdom()) {
      <div class="wisdom-card">
        <mat-icon class="wisdom-icon">format_quote</mat-icon>
        <p class="wisdom-text">"{{ wisdom()!.text }}"</p>
        @if (wisdom()!.author) {
          <span class="wisdom-author">— {{ wisdom()!.author }}</span>
        }
      </div>
    }

    <!-- Traffic Light Status -->
    <div class="status-section">
      <div class="traffic-light" [class]="'light-' + trafficLight()">
        <div class="light-dot"></div>
        <div class="light-info">
          <span class="light-label">{{ trafficLightLabel() }}</span>
          <span class="light-desc">{{ trafficLightDesc() }}</span>
        </div>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="stats-grid">
      <div class="stat-card stat-green">
        <mat-icon>local_fire_department</mat-icon>
        <div class="stat-content">
          <span class="stat-value">{{ stats()?.currentRuleStreak ?? 0 }}</span>
          <span class="stat-label">Day Streak</span>
        </div>
      </div>
      <div class="stat-card stat-blue">
        <mat-icon>bar_chart</mat-icon>
        <div class="stat-content">
          <span class="stat-value">{{ stats()?.tradesToday ?? 0 }} / {{ maxTrades() }}</span>
          <span class="stat-label">Trades Today</span>
        </div>
      </div>
      <div class="stat-card" [class.stat-green]="(stats()?.pnlToday ?? 0) >= 0" [class.stat-red]="(stats()?.pnlToday ?? 0) < 0">
        <mat-icon>{{ (stats()?.pnlToday ?? 0) >= 0 ? 'trending_up' : 'trending_down' }}</mat-icon>
        <div class="stat-content">
          <span class="stat-value">{{ stats()?.pnlToday ?? 0 | currency:'USD':'symbol':'1.0-0' }}</span>
          <span class="stat-label">P&L Today</span>
        </div>
      </div>
      <div class="stat-card stat-purple">
        <mat-icon>grading</mat-icon>
        <div class="stat-content">
          <span class="stat-value">{{ gradeDisplay() }}</span>
          <span class="stat-label">Avg Grade</span>
        </div>
      </div>
    </div>

    <!-- Performance Stats -->
    <div class="stats-grid secondary">
      <div class="stat-card stat-amber">
        <mat-icon>percent</mat-icon>
        <div class="stat-content">
          <span class="stat-value">{{ stats()?.winRate ?? 0 }}%</span>
          <span class="stat-label">Win Rate</span>
        </div>
      </div>
      <div class="stat-card stat-blue">
        <mat-icon>checklist</mat-icon>
        <div class="stat-content">
          <span class="stat-value">{{ stats()?.checklistComplianceRate ?? 0 }}%</span>
          <span class="stat-label">Compliance</span>
        </div>
      </div>
      <div class="stat-card stat-green">
        <mat-icon>emoji_events</mat-icon>
        <div class="stat-content">
          <span class="stat-value">{{ stats()?.longestRuleStreak ?? 0 }}</span>
          <span class="stat-label">Best Streak</span>
        </div>
      </div>
      <div class="stat-card stat-red">
        <mat-icon>functions</mat-icon>
        <div class="stat-content">
          <span class="stat-value">{{ stats()?.totalTrades ?? 0 }}</span>
          <span class="stat-label">Total Trades</span>
        </div>
      </div>
    </div>

    <!-- Weekly Focus -->
    @if (weeklyFocus()) {
      <mat-card class="focus-card">
        <mat-card-content>
          <div class="focus-header">
            <mat-icon class="focus-icon">center_focus_strong</mat-icon>
            <span class="focus-title">This Week's Focus</span>
          </div>
          <p class="focus-rule">"{{ weeklyFocus()!.ruleText }}"</p>
          <div class="focus-dots">
            @for (day of [1,2,3,4,5]; track day) {
              <div class="focus-dot" [class.filled]="day <= (weeklyFocus()!.complianceDays ?? 0)"></div>
            }
            <span class="focus-days">{{ weeklyFocus()!.complianceDays ?? 0 }}/5 days</span>
          </div>
        </mat-card-content>
      </mat-card>
    }

    <!-- Quick Actions -->
    <div class="quick-actions">
      <h3 class="section-title">Quick Actions</h3>
      <div class="action-grid">
        <a class="action-card" routerLink="/trading/premarket">
          <div class="action-icon blue"><mat-icon>wb_twilight</mat-icon></div>
          <span class="action-label">Pre-Market Plan</span>
          <span class="action-status" [class.done]="hasPremarket()">{{ hasPremarket() ? 'Done' : 'Not done' }}</span>
        </a>
        <a class="action-card" routerLink="/trading/checklist">
          <div class="action-icon green"><mat-icon>checklist</mat-icon></div>
          <span class="action-label">Trade Checklist</span>
          <span class="action-status">Enter a trade</span>
        </a>
        <a class="action-card" routerLink="/trading/journal">
          <div class="action-icon purple"><mat-icon>auto_stories</mat-icon></div>
          <span class="action-label">Trade Journal</span>
          <span class="action-status">View trades</span>
        </a>
        <a class="action-card" routerLink="/trading/review">
          <div class="action-icon amber"><mat-icon>grading</mat-icon></div>
          <span class="action-label">Daily Review</span>
          <span class="action-status">Grade your day</span>
        </a>
        <a class="action-card" routerLink="/trading/setups">
          <div class="action-icon red"><mat-icon>tune</mat-icon></div>
          <span class="action-label">My Setups</span>
          <span class="action-status">Configure</span>
        </a>
        <a class="action-card" routerLink="/trading/playbook">
          <div class="action-icon teal"><mat-icon>menu_book</mat-icon></div>
          <span class="action-label">Playbook</span>
          <span class="action-status">Rules & wisdom</span>
        </a>
      </div>
    </div>

    <!-- Insights & Integrations -->
    <div class="insights-section">
      <h3 class="section-title">Insights & Tools</h3>
      <div class="insight-cards">
        <!-- Position Sizer -->
        <mat-card class="insight-card">
          <mat-card-content>
            <div class="insight-header">
              <div class="insight-icon-wrap green"><mat-icon>calculate</mat-icon></div>
              <span class="insight-title">Position Sizer</span>
            </div>
            <p class="insight-desc">Risk {{ riskPercent() }}% = max loss {{ maxRiskDollars() | currency:'USD':'symbol':'1.0-0' }} per trade</p>
            <div class="insight-badge green">Based on brokerage balance</div>
          </mat-card-content>
        </mat-card>

        <!-- Cooldown Timer -->
        <mat-card class="insight-card" [class.active-cooldown]="cooldownActive()">
          <mat-card-content>
            <div class="insight-header">
              <div class="insight-icon-wrap" [class.red]="cooldownActive()" [class.blue]="!cooldownActive()">
                <mat-icon>{{ cooldownActive() ? 'hourglass_top' : 'timer' }}</mat-icon>
              </div>
              <span class="insight-title">{{ cooldownActive() ? 'Cooldown Active' : 'Cooldown Timer' }}</span>
            </div>
            <p class="insight-desc">{{ cooldownActive() ? 'Wait before your next trade. Breathe.' : '5-min pause after each loss to prevent revenge trading' }}</p>
            @if (cooldownActive()) {
              <div class="insight-badge red">{{ cooldownMinutes() }}m remaining</div>
            } @else {
              <div class="insight-badge blue">Auto-activates on loss</div>
            }
          </mat-card-content>
        </mat-card>

        <!-- Pattern Detector -->
        <mat-card class="insight-card">
          <mat-card-content>
            <div class="insight-header">
              <div class="insight-icon-wrap purple"><mat-icon>insights</mat-icon></div>
              <span class="insight-title">Pattern Insights</span>
            </div>
            <p class="insight-desc">{{ patternInsight() }}</p>
            <div class="insight-badge purple">AI-powered analysis</div>
          </mat-card-content>
        </mat-card>

        <!-- Finance Sync -->
        <mat-card class="insight-card">
          <mat-card-content>
            <div class="insight-header">
              <div class="insight-icon-wrap amber"><mat-icon>sync_alt</mat-icon></div>
              <span class="insight-title">Finance Sync</span>
            </div>
            <p class="insight-desc">Trades auto-log to your brokerage account as transactions</p>
            <div class="insight-badge amber">Connected to Finance</div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>

    <!-- Index Options Quick Reference -->
    <mat-card class="options-card">
      <mat-card-content>
        <div class="options-header">
          <mat-icon class="options-icon">show_chart</mat-icon>
          <span class="options-title">0DTE Quick Reference</span>
        </div>
        <div class="options-grid">
          <div class="options-item">
            <span class="options-label">SPX</span>
            <span class="options-hint">$100/pt, cash settled, no early assignment</span>
          </div>
          <div class="options-item">
            <span class="options-label">NDX</span>
            <span class="options-hint">$100/pt, less liquid, wider spreads</span>
          </div>
          <div class="options-item">
            <span class="options-label">0DTE Risk</span>
            <span class="options-hint">Gamma explosion near expiry — respect your stops</span>
          </div>
          <div class="options-item">
            <span class="options-label">Key Times</span>
            <span class="options-hint">9:45-10:15 & 2:30-3:30 highest probability</span>
          </div>
        </div>
      </mat-card-content>
    </mat-card>

    <!-- Mentor Message -->
    <mat-card class="mentor-card">
      <mat-card-content>
        <div class="mentor-header">
          <mat-icon class="mentor-icon">psychology</mat-icon>
          <span class="mentor-title">Mentor Note</span>
        </div>
        <p class="mentor-text">{{ mentorMessage() }}</p>
        <div class="mentor-encouragement">
          <mat-icon>favorite</mat-icon>
          <span>7 years of persistence shows passion. Channel that energy into process mastery.</span>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    :host { display: block; }

    .dashboard-banner {
      position: relative;
      margin: -24px -24px 24px;
      padding: 40px 24px 32px;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      overflow: hidden;
    }
    .banner-pattern {
      position: absolute;
      inset: 0;
      background:
        radial-gradient(circle at 30% 70%, rgba(0, 122, 255, 0.15) 0%, transparent 50%),
        radial-gradient(circle at 70% 30%, rgba(88, 86, 214, 0.12) 0%, transparent 40%);
    }
    .banner-content { position: relative; text-align: center; }
    .banner-icon {
      width: 56px; height: 56px; border-radius: 16px;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 12px;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    .banner-icon mat-icon { font-size: 28px; width: 28px; height: 28px; color: #4ecdc4; }
    h2 { margin: 0; color: #fff; font-size: 1.5rem; font-weight: 700; letter-spacing: var(--tracking-tight); }
    .banner-subtitle { color: rgba(255, 255, 255, 0.65); font-size: 0.875rem; margin: 4px 0 0; }

    .wisdom-card {
      background: var(--color-surface);
      border-radius: var(--radius-md);
      padding: 20px;
      margin-bottom: var(--spacing-md);
      box-shadow: var(--shadow-sm);
      border-left: 4px solid var(--color-stat-amber);
      position: relative;
    }
    .wisdom-icon { position: absolute; top: 12px; right: 12px; color: var(--color-stat-amber); opacity: 0.3; font-size: 32px; width: 32px; height: 32px; }
    .wisdom-text { font-size: 0.95rem; font-style: italic; line-height: 1.5; margin: 0 0 8px; color: var(--color-text); }
    .wisdom-author { font-size: 0.8rem; font-weight: 600; color: var(--color-text-secondary); }

    .status-section { margin-bottom: var(--spacing-md); }
    .traffic-light {
      display: flex; align-items: center; gap: 14px;
      padding: 14px 18px;
      border-radius: var(--radius-md);
      background: var(--color-surface);
      box-shadow: var(--shadow-sm);
    }
    .light-dot {
      width: 20px; height: 20px; border-radius: 50%; flex-shrink: 0;
      box-shadow: 0 0 12px currentColor;
    }
    .light-info { display: flex; flex-direction: column; }
    .light-label { font-weight: 700; font-size: 0.9rem; }
    .light-desc { font-size: 0.8rem; color: var(--color-text-secondary); }
    .light-green .light-dot { background: var(--color-success); color: var(--color-success); }
    .light-green .light-label { color: var(--color-success); }
    .light-yellow .light-dot { background: var(--color-warning); color: var(--color-warning); }
    .light-yellow .light-label { color: var(--color-warning); }
    .light-red .light-dot { background: var(--color-danger); color: var(--color-danger); }
    .light-red .light-label { color: var(--color-danger); }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--spacing-sm);
      margin-bottom: var(--spacing-md);
    }
    .stats-grid.secondary { margin-bottom: var(--spacing-lg); }
    .stat-card {
      display: flex; align-items: center; gap: 10px;
      background: var(--color-surface);
      border-radius: var(--radius-md);
      padding: 14px;
      box-shadow: var(--shadow-sm);
    }
    .stat-card > mat-icon { font-size: 24px; width: 24px; height: 24px; }
    .stat-card.stat-green > mat-icon { color: var(--color-stat-green); }
    .stat-card.stat-blue > mat-icon { color: var(--color-stat-blue); }
    .stat-card.stat-red > mat-icon { color: var(--color-stat-red); }
    .stat-card.stat-amber > mat-icon { color: var(--color-stat-amber); }
    .stat-card.stat-purple > mat-icon { color: var(--color-stat-purple); }
    .stat-content { display: flex; flex-direction: column; min-width: 0; }
    .stat-value { font-size: 1.15rem; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .stat-label { font-size: 0.7rem; font-weight: 600; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.02em; }

    .focus-card { margin-bottom: var(--spacing-md); }
    .focus-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
    .focus-icon { color: var(--color-stat-amber); }
    .focus-title { font-weight: 700; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.02em; }
    .focus-rule { font-size: 1rem; font-weight: 500; margin: 0 0 12px; line-height: 1.4; }
    .focus-dots { display: flex; align-items: center; gap: 6px; }
    .focus-dot {
      width: 12px; height: 12px; border-radius: 50%;
      background: var(--color-border);
      transition: background 0.2s;
    }
    .focus-dot.filled { background: var(--color-success); box-shadow: 0 0 6px rgba(52, 199, 89, 0.4); }
    .focus-days { font-size: 0.8rem; font-weight: 600; color: var(--color-text-secondary); margin-left: 8px; }

    .section-title { font-size: 0.85rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; color: var(--color-text-secondary); margin: 0 0 12px; }
    .action-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--spacing-sm);
      margin-bottom: var(--spacing-lg);
    }
    .action-card {
      display: flex; flex-direction: column; align-items: center; gap: 8px;
      padding: 18px 12px;
      background: var(--color-surface);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-sm);
      text-decoration: none;
      color: inherit;
      transition: transform 0.15s, box-shadow 0.15s;
      text-align: center;
    }
    .action-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
    .action-icon {
      width: 44px; height: 44px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
    }
    .action-icon mat-icon { color: #fff; font-size: 22px; width: 22px; height: 22px; }
    .action-icon.blue { background: var(--color-stat-blue); }
    .action-icon.green { background: var(--color-stat-green); }
    .action-icon.purple { background: var(--color-stat-purple); }
    .action-icon.amber { background: var(--color-stat-amber); }
    .action-icon.red { background: var(--color-stat-red); }
    .action-icon.teal { background: #2dd4bf; }
    .action-label { font-weight: 600; font-size: 0.8rem; }
    .action-status { font-size: 0.7rem; color: var(--color-text-muted); }
    .action-status.done { color: var(--color-success); font-weight: 600; }

    .insights-section { margin-bottom: var(--spacing-lg); }
    .insight-cards { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--spacing-sm); }
    .insight-card { border-radius: var(--radius-md); transition: transform 0.15s; }
    .insight-card:hover { transform: translateY(-2px); }
    .insight-card.active-cooldown { border: 2px solid var(--color-danger); animation: pulse-border 2s infinite; }
    @keyframes pulse-border { 0%,100% { border-color: var(--color-danger); } 50% { border-color: transparent; } }
    .insight-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
    .insight-icon-wrap {
      width: 36px; height: 36px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
    }
    .insight-icon-wrap mat-icon { font-size: 20px; width: 20px; height: 20px; color: #fff; }
    .insight-icon-wrap.green { background: var(--color-stat-green); }
    .insight-icon-wrap.blue { background: var(--color-stat-blue); }
    .insight-icon-wrap.purple { background: var(--color-stat-purple); }
    .insight-icon-wrap.amber { background: var(--color-stat-amber); }
    .insight-icon-wrap.red { background: var(--color-danger); }
    .insight-title { font-weight: 700; font-size: 0.85rem; }
    .insight-desc { font-size: 0.8rem; color: var(--color-text-secondary); margin: 0 0 8px; line-height: 1.4; }
    .insight-badge {
      display: inline-block; font-size: 0.65rem; font-weight: 700; padding: 2px 8px;
      border-radius: var(--radius-full); text-transform: uppercase; letter-spacing: 0.03em;
    }
    .insight-badge.green { background: var(--color-stat-green-bg); color: var(--color-stat-green); }
    .insight-badge.blue { background: var(--color-stat-blue-bg); color: var(--color-stat-blue); }
    .insight-badge.purple { background: var(--color-stat-purple-bg); color: var(--color-stat-purple); }
    .insight-badge.amber { background: var(--color-stat-amber-bg); color: var(--color-stat-amber); }
    .insight-badge.red { background: var(--color-stat-red-bg); color: var(--color-danger); }

    .options-card { margin-bottom: var(--spacing-md); border-left: 4px solid var(--color-stat-blue); }
    .options-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
    .options-icon { color: var(--color-stat-blue); }
    .options-title { font-weight: 700; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.02em; }
    .options-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .options-item { display: flex; flex-direction: column; gap: 2px; }
    .options-label { font-weight: 700; font-size: 0.85rem; color: var(--color-stat-blue); }
    .options-hint { font-size: 0.75rem; color: var(--color-text-secondary); line-height: 1.3; }

    .mentor-card { border-left: 4px solid var(--color-stat-purple); margin-bottom: var(--spacing-md); }
    .mentor-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
    .mentor-icon { color: var(--color-stat-purple); }
    .mentor-title { font-weight: 700; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.02em; }
    .mentor-text { font-size: 0.9rem; line-height: 1.5; margin: 0 0 12px; color: var(--color-text-secondary); }
    .mentor-encouragement {
      display: flex; align-items: flex-start; gap: 8px;
      padding: 10px 12px; border-radius: var(--radius-sm);
      background: var(--color-stat-green-bg); font-size: 0.8rem;
      color: var(--color-stat-green); line-height: 1.4;
    }
    .mentor-encouragement mat-icon { font-size: 16px; width: 16px; height: 16px; flex-shrink: 0; margin-top: 1px; }

    @media (max-width: 599px) {
      .dashboard-banner { margin: -16px -16px 20px; padding: 32px 16px 24px; }
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
      .action-grid { grid-template-columns: repeat(2, 1fr); }
      .insight-cards { grid-template-columns: 1fr; }
      .options-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class TradingDashboardComponent implements OnInit {
  private tradingService = inject(TradingService);

  stats = signal<TradingStats | null>(null);
  wisdom = signal<TradingWisdom | null>(null);
  weeklyFocus = signal<WeeklyFocus | null>(null);
  todayNote = signal<PreMarketNote | null>(null);

  hasPremarket = computed(() => !!this.todayNote());
  maxTrades = computed(() => this.todayNote()?.maxTrades ?? 3);

  riskPercent = signal(1);
  brokerageBalance = signal(10000);
  maxRiskDollars = computed(() => Math.round(this.brokerageBalance() * this.riskPercent() / 100));
  cooldownActive = signal(false);
  cooldownMinutes = signal(0);

  patternInsight = computed(() => {
    const s = this.stats();
    if (!s || s.totalTrades < 5) return 'Need at least 5 trades to detect patterns. Keep logging!';
    if (s.checklistComplianceRate < 60) return 'Pattern: trades without checklist have 2x loss rate. Use it every time.';
    if (s.winRate < 35) return 'Your win rate suggests oversizing or chasing. Try smaller positions, tighter criteria.';
    if (s.setupBreakdown?.length > 0) {
      const best = s.setupBreakdown.reduce((a, b) => a.winRate > b.winRate ? a : b);
      if (best.winRate > 55) return `Your best setup is "${best.setupName}" at ${best.winRate}% win rate. Focus here.`;
    }
    return 'Solid compliance! Next level: track time-of-day patterns for edge refinement.';
  });

  trafficLight = computed(() => {
    const note = this.todayNote();
    const s = this.stats();
    if (!note) return 'red';
    if (note.mentalState === 'red') return 'red';
    if (s && s.tradesToday >= note.maxTrades) return 'red';
    if (s && s.pnlToday <= -note.maxLoss) return 'red';
    if (note.mentalState === 'yellow') return 'yellow';
    if (s && s.tradesToday >= note.maxTrades - 1) return 'yellow';
    return 'green';
  });

  trafficLightLabel = computed(() => {
    const light = this.trafficLight();
    if (light === 'green') return 'Clear to Trade';
    if (light === 'yellow') return 'Caution';
    return 'Stop Trading';
  });

  trafficLightDesc = computed(() => {
    const note = this.todayNote();
    if (!note) return 'Complete your pre-market plan first';
    const light = this.trafficLight();
    if (light === 'red') {
      if (note.mentalState === 'red') return 'Mental state is red — sit this one out';
      return 'Daily limit reached — protect your capital';
    }
    if (light === 'yellow') return 'Approaching limits — be extra selective';
    return 'Pre-market done, limits intact, mind is clear';
  });

  gradeDisplay = computed(() => {
    const avg = this.stats()?.averageGrade ?? 0;
    if (avg >= 3.5) return 'A';
    if (avg >= 2.5) return 'B';
    if (avg >= 1.5) return 'C';
    if (avg >= 0.5) return 'D';
    if (avg > 0) return 'F';
    return '—';
  });

  mentorMessage = computed(() => {
    const s = this.stats();
    if (!s || s.totalTrades === 0) {
      return "Welcome to your trading journey. Remember: the goal isn't to make money today. It's to follow your process today. The money follows the process. After 7 years, you have more market knowledge than most — now it's time to pair that with iron discipline.";
    }
    if (s.checklistComplianceRate < 50) {
      return "Your checklist compliance is below 50%. Every unchecked trade is a gamble, not a trade. With 0DTE options, one impulse trade can wipe a week of gains. The checklist takes 30 seconds — your account takes months to rebuild.";
    }
    if (s.currentRuleStreak >= 7) {
      return `${s.currentRuleStreak} days following your rules! You're rewiring 7 years of habits. This IS the transformation. A disciplined trader with your market experience is unstoppable. Keep compounding this streak.`;
    }
    if (s.winRate > 0 && s.winRate < 40) {
      return "Win rate below 40% with index options often means entering too early or sizing too big. Focus on A+ setups only — if it's not screaming at you, let it pass. Missing a trade costs nothing; a bad trade costs everything.";
    }
    if (s.pnlToday < 0) {
      return "Down day? That's okay — but it's NOT the time to 'make it back.' The best traders have losing days. The difference is they lose SMALL and live to trade tomorrow. Walk away with your capital intact.";
    }
    return "One trade at a time. One rule at a time. One day at a time. Your 7 years of screen time is an asset — trust your reads, but verify with the checklist before acting.";
  });

  ngOnInit(): void {
    this.tradingService.getStats().subscribe({
      next: (data) => this.stats.set(data),
      error: () => {}
    });
    this.tradingService.getDailyWisdom().subscribe({
      next: (data) => this.wisdom.set(data),
      error: () => {}
    });
    this.tradingService.getWeeklyFocus().subscribe({
      next: (data) => this.weeklyFocus.set(data),
      error: () => {}
    });
    this.tradingService.getTodayNote().subscribe({
      next: (data) => this.todayNote.set(data),
      error: () => {}
    });
  }
}
