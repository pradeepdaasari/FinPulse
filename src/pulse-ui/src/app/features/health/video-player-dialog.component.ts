import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-video-player-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="video-dialog-container">
      <div class="video-dialog-header">
        <h3>{{ data.exerciseName }}</h3>
        <button mat-icon-button mat-dialog-close>
          <mat-icon>close</mat-icon>
        </button>
      </div>
      <div class="video-wrapper">
        <iframe
          [src]="embedUrl"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen>
        </iframe>
      </div>
      <div class="video-dialog-footer">
        <a [href]="data.videoUrl" target="_blank" mat-stroked-button>
          <mat-icon>open_in_new</mat-icon> Open in YouTube
        </a>
      </div>
    </div>
  `,
  styles: [`
    .video-dialog-container { padding: 0; }
    .video-dialog-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 12px 16px; border-bottom: 1px solid var(--color-border, #e0e0e0);
    }
    .video-dialog-header h3 { margin: 0; font-size: 1rem; font-weight: 600; }
    .video-wrapper {
      position: relative; width: 100%; padding-bottom: 56.25%; background: #000;
    }
    .video-wrapper iframe {
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    }
    .video-dialog-footer {
      padding: 12px 16px; display: flex; justify-content: center;
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
