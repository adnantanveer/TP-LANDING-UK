import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-laptop',
  imports: [CommonModule],
  templateUrl: './laptop.html',
  styleUrl: './laptop.scss',
})
export class Laptop {
  @Input() lidAngle = 0;       // 0 = closed, 115 = open
  @Input() tiltX    = 20;      // scene tilt: 20° = see lid face from above
  @Input() tiltY    = -12;
  @Input() laptopScale = 0.62;

  get sceneTransform() {
    return `rotateX(${this.tiltX}deg) rotateY(${this.tiltY}deg) scale(${this.laptopScale})`;
  }

  // Lid rotates back from 0° (facing viewer = aluminum visible) to -65° (screen visible)
  get lidTransform() {
    return `rotateX(${-(this.lidAngle / 115) * 65}deg)`;
  }

  // Aluminum back: fully visible when closed, fades as lid opens past 30°
  get backOpacity()   { return Math.min(Math.max(1 - (this.lidAngle - 30) / 35, 0), 1); }
  // Screen: appears as lid opens past 35°
  get screenOpacity() { return Math.min(Math.max((this.lidAngle - 35) / 35, 0), 1); }
  // Keyboard: hidden when closed, fades in as lid rises past 20°
  get baseOpacity()   { return Math.min(Math.max((this.lidAngle - 20) / 40, 0), 1); }

  keyRows: { flex: number }[][] = [
    Array(14).fill({ flex: 1 }),
    [...Array(12).fill({ flex: 1 }), { flex: 1.9 }],
    [{ flex: 1.5 }, ...Array(12).fill({ flex: 1 }), { flex: 1.5 }],
    [{ flex: 1.8 }, ...Array(11).fill({ flex: 1 }), { flex: 2.2 }],
    [{ flex: 2.3 }, ...Array(10).fill({ flex: 1 }), { flex: 2.7 }],
    [{ flex: 1.3 }, { flex: 1.3 }, { flex: 6 }, { flex: 1.3 }, { flex: 1.3 }, { flex: 1.3 }, { flex: 1.3 }],
  ];

  navLinks     = ['Services', 'Hire Devs', 'Industries', 'About'];
  techServices = [
    { icon: '💻', label: 'Custom Software' },
    { icon: '📱', label: 'Mobile Apps' },
    { icon: '☁️', label: 'Cloud Dev' },
    { icon: '🤖', label: 'AI & Chatbots' },
    { icon: '🎨', label: 'UI/UX Design' },
    { icon: '📈', label: 'Digital Marketing' },
  ];
}
