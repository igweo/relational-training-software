import { Injectable } from '@angular/core';
import { ApplyCtx, Cell, GenerateArgs, GenerateResult, MatrixRuleSpec } from '../models/matrix.models';
import { RuleRegistry } from '../constants/matrix-rules';

@Injectable({ providedIn: 'root' })
export class MatrixReasoningService {
  private mulberry32(seed: number) {
    return function() {
      let t = seed += 0x6D2B79F5;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
  }

  private randInt(rng: () => number, lo: number, hi: number) {
    return Math.floor(rng() * (hi - lo + 1)) + lo;
  }

  private choice<T>(rng: () => number, xs: T[]): T { return xs[Math.floor(rng() * xs.length)]; }

  private clone<T>(x: T): T { return JSON.parse(JSON.stringify(x)); }

  generate(args: GenerateArgs): GenerateResult {
    const size = args.size ?? 3;
    const rng = this.mulberry32(args.seed);

    // Build context accessor populated after grid creation
    const ctx: ApplyCtx = {
      size,
      idx: (axis, r, c) => axis === 'row' ? r : axis === 'col' ? c : (r + c),
      getCellAt: (r, c) => (r >= 0 && r < size && c >= 0 && c < size) ? cells[r][c] : undefined
    };

    // Rule selection: sample until constraints independent enough
    const candidateRowSpecs: MatrixRuleSpec[] = [
      { id: 'rotation:progression', axis: 'row', attr: 'rotation', op: 'rotate', params: { stepDeg: this.choice(rng, [90, 180]) } },
      { id: 'numeric:progression', axis: 'row', attr: 'size', op: 'progression', params: { step: 1 } },
      { id: 'numeric:progression', axis: 'row', attr: 'count', op: 'progression', params: { step: 1 } },
      { id: 'attr:alternation', axis: 'row', attr: 'mirror', op: 'alternation', params: { even: 'none', odd: 'h' } },
      { id: 'numeric:index-coded', axis: 'row', attr: 'rotation', op: 'index-coded', params: { a: 90, b: 0, d: 0 } }
    ];
    const candidateColSpecs: MatrixRuleSpec[] = [
      { id: 'shape:cycle', axis: 'col', attr: 'shape', op: 'cycle', params: { phase: this.randInt(rng, 0, 2) } },
      { id: 'fill:cycle', axis: 'col', attr: 'fill', op: 'cycle', params: { phase: this.randInt(rng, 0, 2) } },
      { id: 'numeric:progression', axis: 'col', attr: 'size', op: 'progression', params: { step: 1 } },
      { id: 'position:align', axis: 'col', attr: 'position', op: 'align', params: { axis: 'x' } },
      { id: 'mirror:alternate', axis: 'col', attr: 'mirror', op: 'mirror', params: { mode: 'h' } }
    ];

    let rowSpec = this.choice(rng, candidateRowSpecs);
    let colSpec = this.choice(rng, candidateColSpecs);

    // validate
    RuleRegistry.get(rowSpec.id)?.validate(rowSpec);
    RuleRegistry.get(colSpec.id)?.validate(colSpec);

    // base exemplar
    const base: Cell = { shape: 'triangle', size: 2, count: 1, rotation: 0, mirror: 'none', position: { x: 0.5, y: 0.5 } };

    // fill grid
    const cells: Cell[][] = Array.from({ length: size }, () => Array.from({ length: size }, () => this.clone(base)));
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const rowOp = RuleRegistry.get(rowSpec.id)!;
        const colOp = RuleRegistry.get(colSpec.id)!;
        let cell = this.clone(base);
        cell = rowOp.apply(cell, r, c, ctx, rowSpec);
        cell = colOp.apply(cell, r, c, ctx, colSpec);
        cells[r][c] = cell;
      }
    }

    // Validate non-degeneracy (simple variance check on key attributes)
    const variance = (vals: number[]) => {
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      const v = vals.reduce((s, x) => s + (x - mean) * (x - mean), 0) / vals.length;
      return v;
    };
    const rotVals = cells.flat().map(c => c.rotation ?? 0);
    const sizeVals = cells.flat().map(c => c.size ?? 0);
    if ((variance(rotVals) === 0) && (variance(sizeVals) === 0)) {
      // resample column spec to avoid trivial grids
      colSpec = this.choice(rng, candidateColSpecs);
      RuleRegistry.get(colSpec.id)?.validate(colSpec);
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          let cell = this.clone(base);
          const rowOp = RuleRegistry.get(rowSpec.id)!;
          const colOp = RuleRegistry.get(colSpec.id)!;
          cell = rowOp.apply(cell, r, c, ctx, rowSpec);
          cell = colOp.apply(cell, r, c, ctx, colSpec);
          cells[r][c] = cell;
        }
      }
    }

    // missing slot
    const missing = { row: this.randInt(rng, 0, size - 1), col: this.randInt(rng, 0, size - 1) };
    const truth = this.clone(cells[missing.row][missing.col]);

    // options (truth + distractors)
    const distractors: Cell[] = [];
    const rowOp = RuleRegistry.get(rowSpec.id)!;
    const colOp = RuleRegistry.get(colSpec.id)!;
    if (rowOp.confuse) distractors.push(...rowOp.confuse(truth, missing.row, missing.col, ctx, rowSpec));
    if (colOp.confuse) distractors.push(...colOp.confuse(truth, missing.row, missing.col, ctx, colSpec));

    // generic nudges
    distractors.push(
      { ...truth, size: Math.max(1, (truth.size ?? 2) - 1) },
      { ...truth, size: Math.min(3, (truth.size ?? 2) + 1) },
      { ...truth, count: Math.max(1, (truth.count ?? 1) - 1) },
      { ...truth, count: Math.min(3, (truth.count ?? 1) + 1) },
    );

    const sig = (c: Cell) => JSON.stringify(c);
    const seen = new Set<string>();
    const uniq = distractors
      .filter(d => sig(d) !== sig(truth))
      .filter(d => { const s = sig(d); if (seen.has(s)) return false; seen.add(s); return true; });

    // Create candidate options and shuffle
    let candidates = [truth, ...uniq];
    // Ensure unique-solvability: only truth should fit both rules at (r,c)
    const fitsAll = (cell: Cell) => {
      // simulate row/col application to base at (r,c)
      const rowOp2 = RuleRegistry.get(rowSpec.id)!;
      const colOp2 = RuleRegistry.get(colSpec.id)!;
      let predicted = this.clone(base);
      predicted = rowOp2.apply(predicted, missing.row, missing.col, ctx, rowSpec);
      predicted = colOp2.apply(predicted, missing.row, missing.col, ctx, colSpec);
      return JSON.stringify(predicted) === JSON.stringify(cell);
    };
    // Filter out any candidate besides truth that would also satisfy both rules
    candidates = candidates.filter((c, idx) => idx === 0 || !fitsAll(c));
    const options = candidates.slice(0, 6);
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }
    const correctIndex = options.findIndex(o => sig(o) === sig(truth));

    const explanation = [
      RuleRegistry.get(rowSpec.id)!.verbalize(rowSpec),
      RuleRegistry.get(colSpec.id)!.verbalize(colSpec)
    ];

    return { cells, missing, options, correctIndex, rules: [rowSpec, colSpec], explanation };
  }

  // Map Cell → symbol string for current UI
  cellToSymbol(cell: Cell): string {
    const size = cell.size ?? 2;
    const count = cell.count ?? 1;
    const shapeChar = (() => {
      if (cell.shape === 'circle' || cell.shape === 'ring') {
        return size === 1 ? '·' : size === 2 ? '●' : '⬤';
      }
      if (cell.shape === 'square' || cell.shape === 'bar') {
        return size === 1 ? '▫' : size === 2 ? '□' : '■';
      }
      // triangle
      const rot = ((cell.rotation ?? 0) % 360 + 360) % 360;
      if (rot === 0) return '▲';
      if (rot === 90) return '▶';
      if (rot === 180) return '▼';
      if (rot === 270) return '◀';
      return '▲';
    })();

    let ch = shapeChar;
    if (cell.shape === 'triangle' && cell.mirror === 'h') {
      if (ch === '▶') ch = '◀';
      else if (ch === '◀') ch = '▶';
    }

    if (count <= 1) return ch;
    if (count === 2) return ch + ' ' + ch;
    return ch + ' ' + ch + ' ' + ch;
  }
}


