import {
  Component,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  ElementRef,
  PLATFORM_ID,
  Inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-galaxy-bg',
  standalone: true,
  template: `<canvas #galaxyCanvas class="galaxy-canvas"></canvas>`,
  styles: [`
    .galaxy-canvas {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 0;
      pointer-events: none;
    }
  `]
})
export class GalaxyBg implements AfterViewInit, OnDestroy {
  @ViewChild('galaxyCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;
  private animationId!: number;
  private stars: Star[] = [];
  private nebulae: Nebula[] = [];
  private time = 0;
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngAfterViewInit(): void {
    // ← Solo corre en el browser, nunca en el servidor
    if (!this.isBrowser) return;

    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    this.resize(canvas);
    window.addEventListener('resize', () => this.resize(canvas));
    this.initStars(canvas);
    this.initNebulae(canvas);
    this.animate(canvas);
  }

  private resize(canvas: HTMLCanvasElement): void {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  private initStars(canvas: HTMLCanvasElement): void {
    this.stars = [];
    const layers = [
      { count: 180, size: [0.4, 1.0], speed: [0.008, 0.015], opacity: [0.3, 0.7] },
      { count: 90,  size: [1.0, 1.8], speed: [0.015, 0.025], opacity: [0.5, 0.9] },
      { count: 30,  size: [1.8, 3.0], speed: [0.025, 0.04],  opacity: [0.7, 1.0] },
    ];
    for (const layer of layers) {
      for (let i = 0; i < layer.count; i++) {
        this.stars.push({
          x:            Math.random() * canvas.width,
          y:            Math.random() * canvas.height,
          size:         rand(layer.size[0], layer.size[1]),
          speed:        rand(layer.speed[0], layer.speed[1]),
          opacity:      rand(layer.opacity[0], layer.opacity[1]),
          twinkleOffset: Math.random() * Math.PI * 2,
          twinkleSpeed:  rand(0.004, 0.012),
          hue:          Math.random() < 0.25 ? rand(200, 220) : 0,
        });
      }
    }
  }

  private initNebulae(canvas: HTMLCanvasElement): void {
    this.nebulae = [
      { x: canvas.width * 0.15, y: canvas.height * 0.2,  r: 280, hue: 210, opacity: 0.045 },
      { x: canvas.width * 0.8,  y: canvas.height * 0.6,  r: 320, hue: 220, opacity: 0.035 },
      { x: canvas.width * 0.5,  y: canvas.height * 0.85, r: 250, hue: 200, opacity: 0.03  },
      { x: canvas.width * 0.9,  y: canvas.height * 0.1,  r: 200, hue: 230, opacity: 0.025 },
    ];
  }

  private animate(canvas: HTMLCanvasElement): void {
    this.time++;
    const ctx = this.ctx;

    ctx.fillStyle = '#0a0c12';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (const neb of this.nebulae) {
      const grad = ctx.createRadialGradient(neb.x, neb.y, 0, neb.x, neb.y, neb.r);
      grad.addColorStop(0,   `hsla(${neb.hue}, 70%, 60%, ${neb.opacity})`);
      grad.addColorStop(0.5, `hsla(${neb.hue}, 60%, 40%, ${neb.opacity * 0.4})`);
      grad.addColorStop(1,   'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(neb.x, neb.y, neb.r, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const star of this.stars) {
      star.x -= star.speed;
      if (star.x < -5) star.x = canvas.width + 5;

      const twinkle      = 0.7 + 0.3 * Math.sin(this.time * star.twinkleSpeed + star.twinkleOffset);
      const finalOpacity = star.opacity * twinkle;
      const color        = star.hue === 0
        ? `rgba(240, 245, 255, ${finalOpacity})`
        : `hsla(${star.hue}, 80%, 85%, ${finalOpacity})`;

      if (star.size > 1.8) {
        const glow = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.size * 4);
        glow.addColorStop(0,   color);
        glow.addColorStop(0.4, star.hue === 0
          ? `rgba(200, 220, 255, ${finalOpacity * 0.3})`
          : `hsla(${star.hue}, 70%, 70%, ${finalOpacity * 0.3})`);
        glow.addColorStop(1,   'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * 4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    }

    const edgeFade = ctx.createLinearGradient(0, 0, 0, canvas.height);
    edgeFade.addColorStop(0,    'rgba(10,12,18,0.0)');
    edgeFade.addColorStop(0.92, 'rgba(10,12,18,0.0)');
    edgeFade.addColorStop(1,    'rgba(10,12,18,0.6)');
    ctx.fillStyle = edgeFade;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    this.animationId = requestAnimationFrame(() => this.animate(canvas));
  }

  ngOnDestroy(): void {
    // ← Verificar que estamos en el browser antes de llamar cancelAnimationFrame
    if (this.isBrowser && this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.isBrowser) {
      window.removeEventListener('resize', () => {});
    }
  }
}

interface Star {
  x: number; y: number; size: number; speed: number;
  opacity: number; twinkleOffset: number; twinkleSpeed: number; hue: number;
}
interface Nebula {
  x: number; y: number; r: number; hue: number; opacity: number;
}
function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}