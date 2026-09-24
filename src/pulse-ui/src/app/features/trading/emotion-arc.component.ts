import { Component, input, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TradeNoteEmotion } from '../../core/models/trading.model';

export interface EmotionPoint {
  time: string;
  emotion: string;
  context: string;
}

const EMOTION_CONFIG: Record<string, { icon: string; color: string; order: number }> = {
  confident: { icon: '💪', color: '#4caf50', order: 1 },
  calm: { icon: '😌', color: '#42a5f5', order: 2 },
  relieved: { icon: '😮‍💨', color: '#66bb6a', order: 3 },
  neutral: { icon: '😐', color: '#9e9e9e', order: 4 },
  anxious: { icon: '😰', color: '#ffa726', order: 5 },
  fomo: { icon: '🫣', color: '#ab47bc', order: 6 },
  frustrated: { icon: '😤', color: '#ef5350', order: 7 },
};

@Component({
  selector: 'app-emotion-arc',
  standalone: true,
  imports: [CommonModule, DatePipe, MatTooltipModule],
  template: `
    @if (points().length > 0) {
      <div class="arc-container">
        <div class="arc-label">Emotion Arc</div>
        <div class="arc-track">
          @for (p of points(); track $index) {
            <div class="arc-point"
                 [style.left.%]="pointPosition($index)"
                 [matTooltip]="p.context + ' — ' + (p.time | date:'h:mm a')">
              <div class="point-dot" [style.background]="emotionColor(p.emotion)"
                   [style.bottom.%]="emotionHeight(p.emotion)"></div>
              <span class="point-icon">{{ emotionIcon(p.emotion) }}</span>
            </div>
          }
          <svg class="arc-line" viewBox="0 0 100 40" preserveAspectRatio="none">
            <polyline
              [attr.points]="svgPoints()"
              fill="none"
              stroke="var(--color-primary)"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              opacity="0.3"
            />
          </svg>
        </div>
        <div class="arc-legend">
          @for (e of uniqueEmotions(); track e) {
            <span class="legend-item">
              <span class="legend-dot" [style.background]="emotionColor(e)"></span>
              {{ e | titlecase }}
            </span>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: block; }

    .arc-container {
      background: var(--color-surface-solid);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: 12px 16px;
      margin-bottom: var(--spacing-md);
    }

    .arc-label {
      font-size: 0.625rem; font-weight: var(--weight-semibold);
      color: var(--color-text-muted); text-transform: uppercase;
      letter-spacing: var(--tracking-wide); margin-bottom: 10px;
    }

    .arc-track {
      position: relative;
      height: 52px;
      margin: 0 8px;
    }

    .arc-line {
      position: absolute; inset: 0;
      width: 100%; height: 100%;
    }

    .arc-point {
      position: absolute; bottom: 0;
      transform: translateX(-50%);
      display: flex; flex-direction: column; align-items: center;
      cursor: default;
    }

    .point-dot {
      width: 10px; height: 10px; border-radius: 50%;
      position: absolute;
      border: 2px solid var(--color-surface-solid);
      box-shadow: 0 1px 3px rgba(0,0,0,0.15);
    }

    .point-icon {
      font-size: 14px; line-height: 1;
      position: absolute; bottom: -18px;
    }

    .arc-legend {
      display: flex; gap: 10px; flex-wrap: wrap;
      margin-top: 24px;
    }

    .legend-item {
      display: inline-flex; align-items: center; gap: 4px;
      font-size: 0.625rem; color: var(--color-text-secondary);
      font-weight: var(--weight-medium);
    }

    .legend-dot {
      width: 8px; height: 8px; border-radius: 50%;
    }
  `]
})
export class EmotionArcComponent {
  points = input.required<EmotionPoint[]>();

  uniqueEmotions = computed(() => {
    const emotions = new Set(this.points().map(p => p.emotion));
    return [...emotions];
  });

  pointPosition(index: number): number {
    const total = this.points().length;
    if (total <= 1) return 50;
    return (index / (total - 1)) * 100;
  }

  emotionHeight(emotion: string): number {
    const order = EMOTION_CONFIG[emotion]?.order ?? 4;
    return ((7 - order) / 6) * 80 + 10;
  }

  emotionColor(emotion: string): string {
    return EMOTION_CONFIG[emotion]?.color ?? '#9e9e9e';
  }

  emotionIcon(emotion: string): string {
    return EMOTION_CONFIG[emotion]?.icon ?? '😐';
  }

  svgPoints = computed(() => {
    const pts = this.points();
    if (pts.length < 2) return '';
    return pts.map((p, i) => {
      const x = (i / (pts.length - 1)) * 100;
      const order = EMOTION_CONFIG[p.emotion]?.order ?? 4;
      const y = 40 - ((7 - order) / 6) * 32 - 4;
      return `${x},${y}`;
    }).join(' ');
  });
}
