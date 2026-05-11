import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Particle {
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  color: string;
}

@Component({
  selector: 'app-particle-background',
  imports: [CommonModule],
  templateUrl: './particle-background.html',
  styleUrl: './particle-background.scss',
})
export class ParticleBackground implements OnInit {
  particles: Particle[] = [];
  private readonly colors = ['#6c63ff', '#00d4ff', '#ff6b9d', '#a855f7'];

  ngOnInit() {
    this.particles = Array.from({ length: 60 }, () => ({
      x:        Math.random() * 100,
      y:        Math.random() * 100,
      size:     Math.random() * 2.5 + 0.5,
      delay:    Math.random() * 8,
      duration: Math.random() * 10 + 8,
      color:    this.colors[Math.floor(Math.random() * this.colors.length)],
    }));
  }
}
