import { Injectable } from '@angular/core';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
}

@Injectable({ providedIn: 'root' })
export class ConfettiService {
  private readonly COLORS = ['#007AFF', '#5856D6', '#34C759', '#FF9500', '#FF3B30', '#AF52DE', '#30D158'];
  private readonly DURATION = 3000;
  private readonly FADE_START = 2500;
  private readonly SESSION_KEY = 'confetti_milestones';

  burst(): void {
    if (this.prefersReducedMotion()) {
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.zIndex = '10000';
    canvas.style.pointerEvents = 'none';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d')!;
    const particleCount = 80 + Math.floor(Math.random() * 41); // 80-120
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: canvas.width * 0.5 + (Math.random() - 0.5) * canvas.width * 0.4,
        y: canvas.height * 0.3,
        vx: (Math.random() - 0.5) * 12,
        vy: -(Math.random() * 12 + 4),
        width: 6 + Math.random() * 4,
        height: 6 + Math.random() * 4,
        color: this.COLORS[Math.floor(Math.random() * this.COLORS.length)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.3,
        opacity: 1
      });
    }

    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      if (elapsed >= this.DURATION) {
        canvas.remove();
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        // Physics
        p.vy += 0.35; // gravity
        p.vx += (Math.random() - 0.5) * 0.1; // slight x-drift
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;

        // Fade after 2.5s
        if (elapsed > this.FADE_START) {
          p.opacity = Math.max(0, 1 - (elapsed - this.FADE_START) / (this.DURATION - this.FADE_START));
        }

        // Draw
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
        ctx.restore();
      }

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }

  burstOnce(key: string): void {
    const fired = this.getFiredKeys();
    if (fired.has(key)) {
      return;
    }
    fired.add(key);
    try {
      sessionStorage.setItem(this.SESSION_KEY, JSON.stringify([...fired]));
    } catch {
      // sessionStorage may be unavailable
    }
    this.burst();
  }

  private getFiredKeys(): Set<string> {
    try {
      const raw = sessionStorage.getItem(this.SESSION_KEY);
      if (raw) {
        return new Set(JSON.parse(raw));
      }
    } catch {
      // ignore
    }
    return new Set();
  }

  private prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
}
