import { ApplyCtx, Axis, Cell, MatrixRuleSpec } from '../models/matrix.models';

export interface RuleOperator {
  id: string;
  validate(spec: MatrixRuleSpec): void;
  apply(base: Cell, r: number, c: number, ctx: ApplyCtx, spec: MatrixRuleSpec): Cell;
  verbalize(spec: MatrixRuleSpec): string;
  confuse?(truth: Cell, r: number, c: number, ctx: ApplyCtx, spec: MatrixRuleSpec): Cell[];
}

export const RuleRegistry = new Map<string, RuleOperator>();

function idx(axis: Axis, r: number, c: number) {
  return axis === 'row' ? r : axis === 'col' ? c : (r + c);
}

function clamp(n: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, n)); }
function clone<T>(x: T): T { return JSON.parse(JSON.stringify(x)); }

const NUMERIC_LIMITS: Record<string, { min: number; max: number; wrap?: boolean; step?: number }> = {
  size: { min: 1, max: 3 },
  count: { min: 1, max: 3 },
  rotation: { min: 0, max: 359, wrap: true, step: 90 },
  strokeWidth: { min: 1, max: 5 },
  opacity: { min: 0, max: 1 },
  sides: { min: 3, max: 8 },
  textureAngle: { min: 0, max: 180 },
  nesting: { min: 1, max: 3 }
};

const SHAPES: Cell['shape'][] = ['triangle', 'square', 'circle', 'ring', 'bar'];
const FILLS: NonNullable<Cell['fill']>[] = ['solid', 'none', 'striped'];
const MIRRORS: NonNullable<Cell['mirror']>[] = ['none', 'h', 'v'];

function ensureNumeric(attr: string) {
  if (!NUMERIC_LIMITS[attr]) throw new Error(`Numeric limits not defined for attr: ${attr}`);
}

// Generic numeric progression (also used by arithmetic/geometric/mod/index-coded)
function applyNumeric(base: Cell, r: number, c: number, spec: MatrixRuleSpec, transform: (value: number, k: number) => number): Cell {
  const limits = NUMERIC_LIMITS[spec.attr];
  const k = idx(spec.axis, r, c);
  const current = (base as any)[spec.attr] ?? limits.min;
  let next = transform(Number(current), k);
  if (limits.wrap) {
    const span = limits.max - limits.min + (spec.attr === 'rotation' ? 1 : 0);
    const offset = next - limits.min;
    next = (((offset % span) + span) % span) + limits.min;
  } else {
    next = clamp(next, limits.min, limits.max);
  }
  return { ...base, [spec.attr]: next } as Cell;
}

function verbalAxis(spec: MatrixRuleSpec) { return spec.axis === 'both' ? 'row/column' : spec.axis; }

// PROGRESSION (numeric)
RuleRegistry.set('numeric:progression', {
  id: 'numeric:progression',
  validate: (spec) => { ensureNumeric(spec.attr); },
  apply: (base, r, c, ctx, spec) => applyNumeric(base, r, c, spec, (v, k) => v + (spec.invert ? -1 : 1) * (spec.params?.step ?? 1) * k),
  verbalize: (spec) => `${spec.attr} increases by ${(spec.params?.step ?? 1)} per ${verbalAxis(spec)}${spec.invert ? ' (inverted)' : ''}.`,
  confuse: (truth, r, c, ctx, spec) => {
    const limits = NUMERIC_LIMITS[spec.attr];
    const step = spec.params?.step ?? 1;
    const down = { ...truth, [spec.attr]: clamp(((truth as any)[spec.attr] ?? limits.min) - step, limits.min, limits.max) } as Cell;
    const up = { ...truth, [spec.attr]: clamp(((truth as any)[spec.attr] ?? limits.min) + step, limits.min, limits.max) } as Cell;
    return [down, up];
  }
});

// GEOMETRIC progression (numeric multiply)
RuleRegistry.set('numeric:geometric', {
  id: 'numeric:geometric',
  validate: (spec) => { ensureNumeric(spec.attr); },
  apply: (base, r, c, ctx, spec) => applyNumeric(base, r, c, spec, (v, k) => v * Math.pow(spec.params?.ratio ?? 2, (spec.invert ? -1 : 1) * k)),
  verbalize: (spec) => `${spec.attr} multiplies by ${spec.params?.ratio ?? 2} per ${verbalAxis(spec)}${spec.invert ? ' (inverted)' : ''}.`,
});

// MOD cycle on numeric
RuleRegistry.set('numeric:mod', {
  id: 'numeric:mod',
  validate: (spec) => { ensureNumeric(spec.attr); if (typeof spec.params?.mod !== 'number') throw new Error('mod required'); },
  apply: (base, r, c, ctx, spec) => applyNumeric(base, r, c, spec, (v, k) => (v + (spec.invert ? -1 : 1) * k) % spec.params.mod),
  verbalize: (spec) => `${spec.attr} cycles mod ${spec.params.mod} along ${verbalAxis(spec)}${spec.invert ? ' (inverted)' : ''}.`,
});

// CYCLE (discrete domains)
RuleRegistry.set('shape:cycle', {
  id: 'shape:cycle',
  validate: () => {},
  apply: (base, r, c, ctx, spec) => {
    const k = idx(spec.axis, r, c);
    const phase = spec.params?.phase ?? 0;
    const i = (phase + k) % SHAPES.length;
    return { ...base, shape: SHAPES[i] };
  },
  verbalize: (spec) => `Shape cycles per ${verbalAxis(spec)}.`
});

RuleRegistry.set('fill:cycle', {
  id: 'fill:cycle',
  validate: () => {},
  apply: (base, r, c, ctx, spec) => {
    const k = idx(spec.axis, r, c);
    const phase = spec.params?.phase ?? 0;
    const i = (phase + k) % FILLS.length;
    return { ...base, fill: FILLS[i] };
  },
  verbalize: (spec) => `Fill cycles per ${verbalAxis(spec)}.`
});

RuleRegistry.set('mirror:alternate', {
  id: 'mirror:alternate',
  validate: () => {},
  apply: (base, r, c, ctx, spec) => {
    const k = idx(spec.axis, r, c);
    const mode = spec.params?.mode ?? 'h';
    const alt = (k % 2 === 1) ? mode : 'none';
    return { ...base, mirror: alt } as Cell;
  },
  verbalize: (spec) => `Mirror ${spec.params?.mode ?? 'h'} alternates every ${verbalAxis(spec)}.`
});

// ROTATE (degrees progression)
RuleRegistry.set('rotation:progression', {
  id: 'rotation:progression',
  validate: (spec) => { ensureNumeric('rotation'); if (![0, 45, 90, 120, 180, 270].includes(spec.params?.stepDeg ?? 90)) throw new Error('invalid rotation stepDeg'); },
  apply: (base, r, c, ctx, spec) => applyNumeric(base, r, c, { ...spec, attr: 'rotation' }, (v, k) => v + (spec.invert ? -1 : 1) * (spec.params?.stepDeg ?? 90) * k),
  verbalize: (spec) => `Rotation increases by ${spec.params?.stepDeg ?? 90}° per ${verbalAxis(spec)}${spec.invert ? ' (inverted)' : ''}.`,
  confuse: (truth, r, c, ctx, spec) => [{ ...truth, rotation: (((truth.rotation ?? 0) + 180) % 360) } as Cell]
});

// TRANSLATE position (x,y in 0..1)
RuleRegistry.set('position:translate', {
  id: 'position:translate',
  validate: () => {},
  apply: (base, r, c, ctx, spec) => {
    const k = idx(spec.axis, r, c);
    const dx = (spec.params?.dx ?? 0.1) * (spec.invert ? -1 : 1) * k;
    const dy = (spec.params?.dy ?? 0.0) * (spec.invert ? -1 : 1) * k;
    const p = base.position || { x: 0.5, y: 0.5 };
    return { ...base, position: { x: clamp(p.x + dx, 0, 1), y: clamp(p.y + dy, 0, 1) } };
  },
  verbalize: (spec) => `Position translates by (dx=${spec.params?.dx ?? 0.1}, dy=${spec.params?.dy ?? 0}) per ${verbalAxis(spec)}.`
});

// SCALE → size
RuleRegistry.set('size:scale', {
  id: 'size:scale',
  validate: () => {},
  apply: (base, r, c, ctx, spec) => applyNumeric(base, r, c, { ...spec, attr: 'size' }, (v, k) => v * Math.pow(spec.params?.ratio ?? 1.2, (spec.invert ? -1 : 1) * k)),
  verbalize: (spec) => `Size scales by ratio ${spec.params?.ratio ?? 1.2} per ${verbalAxis(spec)}.`
});

// PERMUTE children: rotate order
RuleRegistry.set('children:permute', {
  id: 'children:permute',
  validate: () => {},
  apply: (base, r, c, ctx, spec) => {
    if (!base.children || base.children.length === 0) return base;
    const k = idx(spec.axis, r, c);
    const shift = (spec.params?.shift ?? 1) * k;
    const n = base.children.length;
    const out = new Array(n);
    for (let i = 0; i < n; i++) out[(i + shift) % n] = clone(base.children[i]);
    return { ...base, children: out };
  },
  verbalize: (spec) => `Child order permutes per ${verbalAxis(spec)}.`
});

// ORBIT → position around center
RuleRegistry.set('position:orbit', {
  id: 'position:orbit',
  validate: () => {},
  apply: (base, r, c, ctx, spec) => {
    const k = idx(spec.axis, r, c);
    const start = spec.params?.startDeg ?? 0;
    const step = spec.params?.stepDeg ?? 45;
    const ang = ((start + step * k) * Math.PI) / 180;
    const rad = spec.params?.radius ?? 0.25;
    return { ...base, position: { x: 0.5 + rad * Math.cos(ang), y: 0.5 + rad * Math.sin(ang) } };
  },
  verbalize: (spec) => `Element orbits center with step ${spec.params?.stepDeg ?? 45}° per ${verbalAxis(spec)}.`
});

// ALIGN → snap position to thirds grid
RuleRegistry.set('position:align', {
  id: 'position:align',
  validate: () => {},
  apply: (base, r, c, ctx, spec) => {
    const k = idx(spec.axis, r, c);
    const thirds = [1/6, 3/6, 5/6];
    const p = base.position || { x: 0.5, y: 0.5 };
    const useX = spec.params?.axis === 'x' || spec.params?.axis === undefined;
    const useY = spec.params?.axis === 'y' || spec.params?.axis === undefined;
    const x = useX ? thirds[(k) % 3] : p.x;
    const y = useY ? thirds[(k) % 3] : p.y;
    return { ...base, position: { x, y } };
  },
  verbalize: (spec) => `Position aligns to thirds along ${verbalAxis(spec)}.`
});

// SET operations over children by shape signature
function sigChild(c: Cell) { return `${c.shape}:${c.size ?? 0}:${c.rotation ?? 0}:${c.fill ?? 'solid'}`; }

RuleRegistry.set('children:set-union', {
  id: 'children:set-union',
  validate: () => {},
  apply: (base) => base, // Union needs accumulation context; generator uses at composition level
  verbalize: () => `Union of features across ${'axis'}.`
});

RuleRegistry.set('children:set-intersect', {
  id: 'children:set-intersect',
  validate: () => {},
  apply: (base) => base,
  verbalize: () => `Intersection of features across axis.`
});

RuleRegistry.set('children:set-diff', {
  id: 'children:set-diff',
  validate: () => {},
  apply: (base) => base,
  verbalize: () => `Difference of features across axis.`
});

RuleRegistry.set('children:xor', {
  id: 'children:xor',
  validate: () => {},
  apply: (base) => base,
  verbalize: () => `Symmetric difference across axis.`
});

// LOGIC on fill as binary feature
RuleRegistry.set('fill:not', {
  id: 'fill:not',
  validate: () => {},
  apply: (base, r, c, ctx, spec) => ({ ...base, fill: (base.fill === 'none') ? 'solid' : 'none' }),
  verbalize: () => `Fill toggles as NOT per step.`
});

// INDEX-CODED numeric mapping: v = a*r + b*c + d (mod or clamped)
RuleRegistry.set('numeric:index-coded', {
  id: 'numeric:index-coded',
  validate: (spec) => { ensureNumeric(spec.attr); },
  apply: (base, r, c, ctx, spec) => {
    const a = spec.params?.a ?? 1; const b = spec.params?.b ?? 1; const d = spec.params?.d ?? 0;
    const val = a * r + b * c + d;
    const withSpec = { ...spec };
    if (spec.attr === 'rotation') { withSpec.params = { stepDeg: 1 }; }
    return applyNumeric(base, r, c, withSpec, () => val);
  },
  verbalize: (spec) => `${spec.attr} is a linear function of row/col indices.`
});

// ALTERNATION: toggle between two values on parity of idx
RuleRegistry.set('attr:alternation', {
  id: 'attr:alternation',
  validate: (spec) => {},
  apply: (base, r, c, ctx, spec) => {
    const k = idx(spec.axis, r, c);
    const evenVal = spec.params?.even;
    const oddVal = spec.params?.odd;
    if (evenVal === undefined || oddVal === undefined) return base;
    return { ...base, [spec.attr]: (k % 2 === 0) ? evenVal : oddVal } as Cell;
  },
  verbalize: (spec) => `${spec.attr} alternates by parity along ${verbalAxis(spec)}.`
});

// SYMMETRY: enforce mirror symmetry presence
RuleRegistry.set('symmetry:bilateral', {
  id: 'symmetry:bilateral',
  validate: () => {},
  apply: (base, r, c, ctx, spec) => {
    const mid = Math.floor((ctx.size - 1) / 2);
    const j = (spec.axis === 'row') ? c : r;
    const mirrorNeeded = (j > mid);
    return { ...base, mirror: mirrorNeeded ? 'h' : 'none' };
  },
  verbalize: (spec) => `Bilateral symmetry enforced across ${spec.axis === 'row' ? 'columns' : 'rows'}.`
});

RuleRegistry.set('symmetry:rotational', {
  id: 'symmetry:rotational',
  validate: () => {},
  apply: (base, r, c, ctx, spec) => ({ ...base, rotation: ((base.rotation ?? 0) + ((r + c) % 2 ? 180 : 0)) % 360 }),
  verbalize: () => `Rotational symmetry of order 2 across the grid.`
});

// CONSERVE: keep size*count approximately constant by adjusting size against count
RuleRegistry.set('conserve:area', {
  id: 'conserve:area',
  validate: () => {},
  apply: (base) => {
    if ((base.size ?? 0) > 0 && (base.count ?? 0) > 0) {
      const area = (base.size ?? 2) * (base.count ?? 1);
      const targetCount = clamp(base.count ?? 1, 1, 3);
      const size = clamp(Math.round(area / targetCount), 1, 3);
      return { ...base, size };
    }
    return base;
  },
  verbalize: () => `Conserved product of size and count.`
});

// BALANCE: keep position centered
RuleRegistry.set('balance:center', {
  id: 'balance:center',
  validate: () => {},
  apply: (base) => ({ ...base, position: { x: 0.5, y: 0.5 } }),
  verbalize: () => `Center-of-mass stays at center.`
});


