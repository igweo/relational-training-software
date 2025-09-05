import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Cell } from '../../models/matrix.models';

@Component({
  selector: 'app-matrix-canvas',
  templateUrl: './matrix-canvas.component.html',
  styleUrls: ['./matrix-canvas.component.css']
})
export class MatrixCanvasComponent {
  @Input() cells: Cell[][] = [];
  @Input() missing?: { row: number; col: number };
  @Input() options: Cell[] = [];
  @Input() selectedIndex: number | null = null;
  @Output() select = new EventEmitter<number>();

  trackByIndex(i: number) { return i; }

  selectOption(i: number) {
    this.select.emit(i);
  }

  // Render helpers
  cellToSvg(cell: Cell, size = 64): string {
    const s = cell.size ?? 2; // 1..3
    const scale = s === 1 ? 0.6 : s === 2 ? 0.8 : 1.0;
    const rot = cell.rotation ?? 0;
    const tx = (cell.position?.x ?? 0.5) * size;
    const ty = (cell.position?.y ?? 0.5) * size;
    const mirrorScaleX = (cell.mirror === 'h') ? -1 : 1;

    const shapePath = (() => {
      switch (cell.shape) {
        case 'circle':
        case 'ring':
          return `<circle cx="0" cy="0" r="18" stroke="currentColor" stroke-width="3" fill="${cell.fill === 'none' ? 'none' : 'currentColor'}"/>`;
        case 'square':
        case 'bar':
          return `<rect x="-18" y="-18" width="36" height="36" stroke="currentColor" stroke-width="3" fill="${cell.fill === 'none' ? 'none' : 'currentColor'}"/>`;
        default: // triangle
          return `<path d="M -20 18 L 20 18 L 0 -22 Z" stroke="currentColor" stroke-width="3" fill="${cell.fill === 'none' ? 'none' : 'currentColor'}"/>`;
      }
    })();

    const group = `<g transform="translate(${tx},${ty}) rotate(${rot}) scale(${mirrorScaleX},1) scale(${scale})">${shapePath}</g>`;

    const count = Math.max(1, Math.min(3, cell.count ?? 1));
    if (count === 1) return group;
    if (count === 2) return `<g>${group}<g transform="translate(24,0)">${group}</g></g>`;
    return `<g>${group}<g transform="translate(24,0)">${group}</g><g transform="translate(-24,0)">${group}</g></g>`;
  }
}


