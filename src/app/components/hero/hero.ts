import { Component, OnInit, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Laptop } from '../laptop/laptop';
import { ParticleBackground } from '../particle-background/particle-background';

@Component({
  selector: 'app-hero',
  imports: [CommonModule, Laptop, ParticleBackground],
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
})
export class Hero implements OnInit {

  // ── Intro copy state ─────────────────────────────────────────
  introOpacity = 1;

  // ── Laptop scroll state (passed as @Input to Laptop) ─────────
  lidAngle     = 0;     // 0 = closed, 115 = open
  tiltX        = 22;    // 22° = slight top-front view so closed aluminum lid is clearly visible
  tiltY        = -14;   // slight left tilt
  laptopScale  = 0.68;  // zoom — 600×720px wrapper so 0.68 = ~408px wide on screen

  // ── Transition overlay + content ─────────────────────────────
  overlayOp  = 0;
  contentOp  = 0;
  contentY   = 50;

  // ── Laptop position offset (keeps it right of text initially) ─
  laptopShiftX = 26;    // vw — starts right, moves to 0 at centre

  // ── Services ─────────────────────────────────────────────────
  stats = [
    { number: '200+', label: 'UK Clients' },
    { number: '10+',  label: 'Years Exp.' },
    { number: '98%',  label: 'Satisfaction' },
  ];

  services = [
    { icon: '💻', title: 'Custom Software',   desc: 'Bespoke solutions engineered for your exact business needs.' },
    { icon: '📱', title: 'Mobile Apps',        desc: 'Native iOS & Android apps built to perform at scale.' },
    { icon: '☁️', title: 'Cloud Development', desc: 'Scalable, resilient cloud-native architectures.' },
    { icon: '🤖', title: 'AI & Chatbots',      desc: 'Intelligent automation to streamline your workflows.' },
    { icon: '🎨', title: 'UI/UX Design',       desc: 'Beautiful, conversion-focused interfaces users love.' },
    { icon: '🚀', title: 'Digital Marketing',  desc: 'Data-driven strategies that grow your reach and revenue.' },
  ];

  constructor(private el: ElementRef) {}
  ngOnInit() {}

  @HostListener('window:scroll')
  onScroll() {
    const wrapper = this.el.nativeElement.querySelector('.hero-scroll-wrapper') as HTMLElement;
    if (!wrapper) return;
    const totalScroll = wrapper.offsetHeight - window.innerHeight;
    const p = Math.min(Math.max(window.scrollY / totalScroll, 0), 1);
    this.drive(p);
  }

  private ease(t: number) { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }
  private band(p: number, s: number, e: number) { return Math.min(Math.max((p-s)/(e-s),0),1); }
  private lerp(a: number, b: number, t: number) { return a + (b-a)*t; }

  private drive(p: number) {
    // Phase 1 (0→0.25): intro text fades out
    this.introOpacity  = 1 - this.ease(this.band(p, 0.03, 0.22));

    // Phase 2 (0.04→0.50): lid opens  0° → 115°
    this.lidAngle      = this.lerp(0, 115, this.ease(this.band(p, 0.04, 0.50)));

    // Phase 2b (0.10→0.55): laptop shifts from right to centre
    this.laptopShiftX  = this.lerp(26, 0, this.ease(this.band(p, 0.10, 0.55)));

    // Phase 3 (0.35→0.68): rotate face-on  (22→2, -14→0)
    const faceP = this.ease(this.band(p, 0.35, 0.68));
    this.tiltX  = this.lerp(22, 2, faceP);
    this.tiltY  = this.lerp(-14, 0, faceP);

    // Phase 4 (0.36→0.90): scale starts with tilt so size stays constant during rotation
    this.laptopScale   = this.lerp(0.68, 7.5, this.ease(this.band(p, 0.36, 0.90)));

    // Phase 5 (0.75→0.90): dark overlay rises then falls
    const ovIn  = this.band(p, 0.75, 0.86);
    const ovOut = this.band(p, 0.86, 0.93);
    this.overlayOp = Math.min(ovIn, 1 - ovOut) * 0.88;

    // Phase 6 (0.88→1.00): reveal services section
    this.contentOp = this.ease(this.band(p, 0.88, 1.00));
    this.contentY  = this.lerp(50, 0, this.ease(this.band(p, 0.88, 1.00)));
  }
}
