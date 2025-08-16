import { Injectable } from '@angular/core';

/**
 * Abstract Symbol Generator — seeded, non-semantic, inline SVG
 *
 * Design goals:
 * - Hard to name: no hearts, stars, letters, or pictograms.
 * - Deterministic via seed.
 * - Tunable complexity & symmetry.
 * - Pure function returns SVG string; also data URL for Angular.
 * - No deps.
 */

// ---------- utilities ----------
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(str: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function randInt(rng: () => number, min: number, max: number) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function shuffle<T>(rng: () => number, arr: T[]) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Chaikin corner-cutting for soft, meaningless blobby curves
function chaikin(points: [number, number][], iterations: number) {
  let pts = points.slice();
  for (let k = 0; k < iterations; k++) {
    const next: [number, number][] = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i];
      const [x1, y1] = pts[i + 1];
      const Q: [number, number] = [0.75 * x0 + 0.25 * x1, 0.75 * y0 + 0.25 * y1];
      const R: [number, number] = [0.25 * x0 + 0.75 * x1, 0.25 * y0 + 0.75 * y1];
      next.push(Q, R);
    }
    pts = next;
  }
  return pts;
}

function jitter(rng: () => number, v: number, amt: number) {
  return v + (rng() * 2 - 1) * amt;
}

type Symmetry = "none" | "bilateral" | "radial";

export interface GlyphOptions {
  size?: number; // viewBox size
  strokeWidth?: number;
  fg?: string; // stroke color
  bg?: string; // background fill (optional)
  complexity?: number; // 1..10 (controls layers)
  symmetry?: Symmetry;
  seed?: string | number;
  attractorStrength?: number; // 0..1 (controls how often attractors are used)
  attractorInfluence?: number; // 0..1 (controls how strongly attractors affect shapes)
}

const DEFAULTS: Required<GlyphOptions> = {
  size: 128,
  strokeWidth: 1.8,
  fg: "currentColor",
  bg: "", // none by default
  complexity: 6,
  symmetry: "radial",
  seed: "0",
  attractorStrength: 0.6,
  attractorInfluence: 0.4,
};

@Injectable({
  providedIn: 'root'
})
export class GlyphGeneratorService {

  constructor() { }

  // ---------- core generator ----------
  generateGlyphSVG(opts: GlyphOptions = {}): string {
    const cfg = { ...DEFAULTS, ...opts } as Required<GlyphOptions>;
    const seedNum = typeof cfg.seed === "number" ? cfg.seed : hashString(String(cfg.seed));
    const rng = mulberry32(seedNum);

    const S = cfg.size;
    const C = S / 2;
    const layers = Math.max(2, Math.min(12, cfg.complexity + randInt(rng, -1, 2)));

    // Attractor system - cardinal directions and diagonals
    const attractors: { angle: number; strength: number }[] = [];
    if (rng() < cfg.attractorStrength) {
      const cardinals = [0, Math.PI / 2, Math.PI, Math.PI * 1.5]; // N, E, S, W
      const diagonals = [Math.PI / 4, 3 * Math.PI / 4, 5 * Math.PI / 4, 7 * Math.PI / 4]; // NE, SE, SW, NW
      
      // Always include at least 2 cardinal directions
      const numCardinals = randInt(rng, 2, 4);
      const selectedCardinals = shuffle(rng, cardinals).slice(0, numCardinals);
      
      // Occasionally add diagonals
      const numDiagonals = rng() < 0.4 ? randInt(rng, 1, 2) : 0;
      const selectedDiagonals = shuffle(rng, diagonals).slice(0, numDiagonals);
      
      [...selectedCardinals, ...selectedDiagonals].forEach(angle => {
        attractors.push({
          angle,
          strength: 0.3 + rng() * 0.4 // vary strength per attractor
        });
      });
    }

    function attractToDirection(x: number, y: number, baseRadius: number): [number, number] {
      if (attractors.length === 0) return [x, y];
      
      let newX = x;
      let newY = y;
      const dx = x - C;
      const dy = y - C;
      const currentAngle = Math.atan2(dy, dx);
      const currentRadius = Math.sqrt(dx * dx + dy * dy);
      
      // Find closest attractor
      let closestAttractor = attractors[0];
      let minDiff = Math.PI * 2;
      
      attractors.forEach(att => {
        let diff = Math.abs(currentAngle - att.angle);
        if (diff > Math.PI) diff = Math.PI * 2 - diff; // wrap around
        if (diff < minDiff) {
          minDiff = diff;
          closestAttractor = att;
        }
      });
      
      // Pull toward closest attractor if within influence range
      if (minDiff < Math.PI / 3) { // 60 degree influence range
        const pullStrength = cfg.attractorInfluence * closestAttractor.strength * (1 - minDiff / (Math.PI / 3));
        const targetRadius = baseRadius + (currentRadius - baseRadius) * (1 + pullStrength * 0.5);
        
        // Blend current angle toward attractor angle
        const targetAngle = currentAngle + (closestAttractor.angle - currentAngle) * pullStrength * 0.3;
        
        newX = C + Math.cos(targetAngle) * targetRadius;
        newY = C + Math.sin(targetAngle) * targetRadius;
      }
      
      return [newX, newY];
    }

    // helper to build a path from points
    function pathFrom(points: [number, number][], closed = false) {
      const p = points.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(" ");
      return closed ? p + " Z" : p;
    }

    function mirrorBilateral(points: [number, number][]) {
      const mirrored = points.map(([x, y]) => [S - x, y] as [number, number]);
      return [...points, ...mirrored.reverse()];
    }

    function mirrorRadial(points: [number, number][], folds: number) {
      const out: [number, number][][] = [];
      const angleStep = (Math.PI * 2) / folds;
      for (let i = 0; i < folds; i++) {
        const a = i * angleStep;
        const cos = Math.cos(a), sin = Math.sin(a);
        out.push(
          points.map(([x, y]) => {
            const dx = x - C, dy = y - C;
            const rx = C + dx * cos - dy * sin;
            const ry = C + dx * sin + dy * cos;
            return [rx, ry] as [number, number];
          })
        );
      }
      return out.flat();
    }

    function makeBlob(radius: number, verts: number, useAttractors: boolean = false) {
      const pts: [number, number][] = [];
      for (let i = 0; i < verts; i++) {
        const a = (i / verts) * Math.PI * 2;
        const r = radius * (0.7 + rng() * 0.6);
        let x = C + Math.cos(a) * r;
        let y = C + Math.sin(a) * r;
        
        // Apply attractor influence
        if (useAttractors) {
          [x, y] = attractToDirection(x, y, radius);
        }
        
        pts.push([x, y]);
      }
      pts.push(pts[0]);
      return chaikin(pts, 2 + randInt(rng, 0, 2));
    }

    function makePolyline(rings: number, verts: number, useAttractors: boolean = false) {
      const pts: [number, number][] = [];
      const base = S * 0.12 + rng() * S * 0.12;
      for (let r = 0; r < rings; r++) {
        const radius = base + (r * (S / 2 - base)) / rings;
        for (let i = 0; i < verts; i++) {
          const ang = (i / verts) * Math.PI * 2 + rng() * 0.2;
          const rr = radius * (0.85 + rng() * 0.3);
          let x = C + Math.cos(ang) * rr;
          let y = C + Math.sin(ang) * rr;
          
          // Apply attractor influence
          if (useAttractors) {
            [x, y] = attractToDirection(x, y, radius);
          }
          
          pts.push([x, y]);
        }
      }
      return pts;
    }

    function hatch(count: number) {
      const segs: string[] = [];
      for (let i = 0; i < count; i++) {
        const x1 = rng() * S, y1 = rng() * S;
        const len = S * (0.15 + rng() * 0.25);
        const ang = rng() * Math.PI * 2;
        const x2 = x1 + Math.cos(ang) * len;
        const y2 = y1 + Math.sin(ang) * len;
        segs.push(`M${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)}`);
      }
      return segs.join(" ");
    }

    const elements: string[] = [];

    if (cfg.bg) {
      elements.push(`<rect x="0" y="0" width="${S}" height="${S}" fill="${cfg.bg}"/>`);
    }

    // decide symmetry
    const sym: Symmetry = cfg.symmetry === "none" ? "none" : (rng() < 0.5 ? cfg.symmetry : "bilateral");

    // Add spoke/ray features when attractors are active
    if (attractors.length > 0 && rng() < 0.5) {
      const spokeAlpha = (0.2 + rng() * 0.3).toFixed(2);
      attractors.forEach(att => {
        if (rng() < 0.6) { // Not every attractor gets a spoke
          const startRadius = S * (0.08 + rng() * 0.1);
          const endRadius = S * (0.2 + rng() * 0.15);
          const x1 = C + Math.cos(att.angle) * startRadius;
          const y1 = C + Math.sin(att.angle) * startRadius;
          const x2 = C + Math.cos(att.angle) * endRadius;
          const y2 = C + Math.sin(att.angle) * endRadius;
          elements.push(`<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)}" fill="none" stroke="${cfg.fg}" stroke-opacity="${spokeAlpha}" stroke-width="${(cfg.strokeWidth * 0.6).toFixed(2)}"/>`);
        }
      });
    }

    for (let i = 0; i < layers; i++) {
      const choice = rng();
      const strokeAlpha = (0.4 + rng() * 0.5).toFixed(2); // Reduced base opacity to prevent dark ball
      const stroke = `${cfg.fg}`;
      const useAttractors = attractors.length > 0 && rng() < 0.7;

      if (choice < 0.3) { // Reduced probability for closed shapes
        // blobby closed shapes
        const verts = randInt(rng, 5, 9);
        const r0 = S * (0.15 + rng() * 0.2); // Slightly larger base radius
        let pts = makeBlob(r0, verts, useAttractors);
        if (sym === "bilateral") pts = mirrorBilateral(pts);
        if (sym === "radial") pts = mirrorRadial(pts, 4 + randInt(rng, 0, 3));
        const d = pathFrom(pts, true);
        elements.push(`<path d="${d}" fill="none" stroke="${stroke}" stroke-opacity="${strokeAlpha}" stroke-width="${(cfg.strokeWidth * (0.8 + i / layers * 0.4)).toFixed(2)}"/>`);
      } else if (choice < 0.65) {
        // polyline rings
        const pts = makePolyline(1 + randInt(rng, 1, 2), randInt(rng, 6, 10), useAttractors); // Fewer vertices
        let pts2 = pts.map(([x, y]) => [jitter(rng, x, 2), jitter(rng, y, 2)] as [number, number]); // Less jitter
        if (sym === "bilateral") pts2 = mirrorBilateral(pts2);
        if (sym === "radial") pts2 = mirrorRadial(pts2, 5 + randInt(rng, -1, 2));
        const d = pathFrom(pts2, false);
        elements.push(`<path d="${d}" fill="none" stroke="${stroke}" stroke-opacity="${strokeAlpha}" stroke-width="${(cfg.strokeWidth * 0.7).toFixed(2)}"/>`);
      } else {
        // hatches/noise - reduced count to prevent density
        const segs = hatch(randInt(rng, 4, 10));
        elements.push(`<path d="${segs}" fill="none" stroke="${stroke}" stroke-opacity="${strokeAlpha}" stroke-width="${(cfg.strokeWidth * 0.6).toFixed(2)}"/>`);
      }

      // occasional dots (reduced frequency and moved away from center)
      if (rng() < 0.4) {
        const dots = randInt(rng, 2, 6);
        for (let d = 0; d < dots; d++) {
          const minRadius = S * 0.2; // Keep dots away from center
          const maxRadius = S * 0.4;
          const radius = minRadius + rng() * (maxRadius - minRadius);
          let angle = rng() * Math.PI * 2;
          
          // Bias dots toward attractors if they exist
          if (useAttractors && rng() < 0.6) {
            const att = attractors[Math.floor(rng() * attractors.length)];
            angle = att.angle + (rng() - 0.5) * Math.PI * 0.3; // Within 54 degrees of attractor
          }
          
          const x = C + Math.cos(angle) * radius;
          const y = C + Math.sin(angle) * radius;
          const r = 0.4 + rng() * (S * 0.015);
          elements.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="${stroke}" fill-opacity="${(0.2 + rng() * 0.4).toFixed(2)}"/>`);
        }
      }
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}" shape-rendering="geometricPrecision">${elements.join("")}</svg>`;
    return svg;
  }

  svgToDataURL(svg: string): string {
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  /**
   * Generate a glyph as a data URL for use in Angular templates
   */
  generateGlyphDataURL(seed: string | number, options: GlyphOptions = {}): string {
    const svg = this.generateGlyphSVG({ ...options, seed });
    return this.svgToDataURL(svg);
  }

  /**
   * Generate multiple unique glyphs for a given set of seeds
   */
  generateGlyphSet(seeds: (string | number)[], options: GlyphOptions = {}): Map<string | number, string> {
    const glyphMap = new Map<string | number, string>();
    
    seeds.forEach(seed => {
      const svg = this.generateGlyphSVG({ ...options, seed });
      glyphMap.set(seed, this.svgToDataURL(svg));
    });
    
    return glyphMap;
  }
}
