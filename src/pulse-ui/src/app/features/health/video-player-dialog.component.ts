import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-video-player-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, MatTooltipModule],
  template: `
    <div class="dialog-banner">
      <div class="banner-pattern"></div>
      <div class="banner-content">
        <div class="dialog-header-icon">
          <mat-icon>play_circle</mat-icon>
        </div>
        <div>
          <h2 mat-dialog-title>{{ data.exerciseName }}</h2>
          <p class="dialog-subtitle">Exercise demo video</p>
        </div>
        <span class="banner-spacer"></span>
        <button mat-icon-button mat-dialog-close class="header-close" matTooltip="Close">
          <mat-icon>close</mat-icon>
        </button>
      </div>
    </div>
    <div class="video-wrapper">
      <iframe
        [src]="embedUrl"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen>
      </iframe>
    </div>
    <div class="video-footer">
      <a [href]="data.videoUrl" target="_blank" mat-stroked-button>
        <mat-icon>open_in_new</mat-icon> Open in YouTube
      </a>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .dialog-banner {
      position: relative;
      margin: -24px -24px 0;
      padding: 16px 20px 14px;
      background: linear-gradient(135deg, #FF2D55 0%, #AF52DE 100%);
      overflow: hidden;
    }
    .banner-pattern {
      position: absolute; inset: 0;
      background:
        radial-gradient(circle at 20% 80%, rgba(255,255,255,0.08) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(255,255,255,0.06) 0%, transparent 40%);
    }
    .banner-content {
      position: relative;
      display: flex; align-items: center; gap: 10px;
    }
    .dialog-header-icon {
      width: 32px; height: 32px; border-radius: 8px;
      background: rgba(255,255,255,0.2);
      display: flex; align-items: center; justify-content: center;
      border: 1px solid rgba(255,255,255,0.3);
      flex-shrink: 0;
    }
    .dialog-header-icon mat-icon { font-size: 16px; width: 16px; height: 16px; color: #fff; }
    h2[mat-dialog-title] {
      margin: 0 !important; padding: 0 !important;
      font-size: 0.9rem !important; font-weight: 700 !important;
      color: #fff !important;
    }
    .dialog-subtitle { color: rgba(255,255,255,0.7); font-size: 0.68rem; margin: 1px 0 0; }
    .banner-spacer { flex: 1; }
    .header-close {
      color: rgba(255,255,255,0.9) !important;
      width: 36px !important; height: 36px !important;
      padding: 0 !important;
      display: inline-flex !important; align-items: center !important; justify-content: center !important;
      border-radius: 50% !important;
      background: rgba(255,255,255,0.12) !important;
      border: 1px solid rgba(255,255,255,0.2) !important;
    }
    .header-close:hover { background: rgba(255,255,255,0.25) !important; }
    .header-close mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .video-wrapper {
      position: relative; width: 100%; padding-bottom: 56.25%; background: #000;
      margin: 0 -24px; width: calc(100% + 48px);
    }
    .video-wrapper iframe {
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    }
    .video-footer {
      padding: 14px 0 4px; display: flex; justify-content: center;
    }

    @media (max-width: 599px) {
      .dialog-banner { margin: -16px -16px 0; padding: 12px 16px 10px; }
      .video-wrapper { margin: 0 -16px; width: calc(100% + 32px); }
    }
  `]
})
export class VideoPlayerDialogComponent {
  data = inject<{ videoUrl: string; exerciseName: string }>(MAT_DIALOG_DATA);
  private sanitizer = inject(DomSanitizer);

  get embedUrl(): SafeResourceUrl {
    const videoId = this.extractVideoId(this.data.videoUrl);
    const url = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  private extractVideoId(url: string): string {
    const match = url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^?]+)/);
    return match ? match[1] : '';
  }
}
