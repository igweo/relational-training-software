export type Axis = 'row' | 'col' | 'both';

export type Attr =
  | 'shape'
  | 'sides'
  | 'count'
  | 'size'
  | 'color'
  | 'fill'
  | 'strokeWidth'
  | 'opacity'
  | 'rotation'
  | 'mirror'
  | 'position'
  | 'textureAngle'
  | 'nesting';

export type Op =
  | 'progression'
  | 'cycle'
  | 'arithmetic'
  | 'geometric'
  | 'mod'
  | 'rotate'
  | 'mirror'
  | 'translate'
  | 'scale'
  | 'permute'
  | 'orbit'
  | 'align'
  | 'set-union'
  | 'set-intersect'
  | 'set-diff'
  | 'xor'
  | 'and'
  | 'or'
  | 'not'
  | 'index-coded'
  | 'alternation'
  | 'symmetry'
  | 'anti-symmetry'
  | 'conserve'
  | 'balance';

export interface MatrixRuleSpec {
  id: string;
  axis: Axis;
  attr: Attr;
  op: Op;
  params: Record<string, any>;
  difficulty?: number;
  weight?: number;
  invert?: boolean; // meta-op: invert progression direction
}

export interface Position {
  x: number; // 0..1 cell-local
  y: number; // 0..1 cell-local
}

export interface Cell {
  shape: 'circle' | 'square' | 'triangle' | 'polygon' | 'bar' | 'ring';
  sides?: number;        // for polygon
  count?: number;        // repetitions 1..n (keep 1..3 in UI mapping)
  size?: number;         // 1..n (normalize to 1..3 for legacy)
  color?: string;        // token id
  fill?: 'solid' | 'none' | 'striped';
  strokeWidth?: number;  // 1..n
  opacity?: number;      // 0..1
  rotation?: number;     // degrees
  mirror?: 'h' | 'v' | 'none';
  position?: Position;   // local offset
  textureAngle?: number; // hatch orientation
  nesting?: number;      // concentric count
  children?: Cell[];     // composite
}

export interface ApplyCtx {
  size: number; // grid size
  idx(axis: Axis, r: number, c: number): number;
  // Access to neighbors if needed by set/logic/topology ops
  getCellAt(r: number, c: number): Cell | undefined;
}

export interface GenerateArgs {
  seed: number;
  level: number;
  size?: 3 | 4;
}

export interface GenerateResult {
  cells: Cell[][];
  missing: { row: number; col: number };
  options: Cell[]; // candidates for missing slot
  correctIndex: number;
  rules: MatrixRuleSpec[];
  explanation: string[];
}


