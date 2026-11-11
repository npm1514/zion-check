'use client';

import { useEffect, useState } from 'react';

/**
 * Cuts the jester out of the 🃏 emoji so it can sit on our own white card.
 *
 * The emoji is drawn as a whole card (cream face, J corners, jester). We draw it
 * to a canvas, trim the emoji's card border, flood-fill the cream background
 * from the edges (it stops at the jester's dark outline), keep only the largest
 * remaining shape (the jester, dropping the emoji's J corners), and return it
 * as a transparent PNG data URL. Runs once per page load in the browser.
 */
function extractJester(): string | null {
  const S = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = S;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  ctx.font = `${S}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'center';
  ctx.fillText('🃏', S / 2, S * 0.87);

  // Bounding box of everything drawn
  const full = ctx.getImageData(0, 0, S, S).data;
  let L = S, T = S, R = -1, B = -1;
  for (let j = 0; j < S; j++) {
    for (let i = 0; i < S; i++) {
      if (full[(j * S + i) * 4 + 3] > 40) {
        if (i < L) L = i;
        if (i > R) R = i;
        if (j < T) T = j;
        if (j > B) B = j;
      }
    }
  }
  if (R < 0) return null; // no emoji font available

  // Trim the emoji's own card border
  const inset = Math.round(Math.min(R - L, B - T) * 0.07);
  const x0 = L + inset, y0 = T + inset;
  const W = R - inset - x0 + 1, H = B - inset - y0 + 1;
  if (W <= 0 || H <= 0) return null;
  const img = ctx.getImageData(x0, y0, W, H);
  const p = img.data;

  // Background colour, sampled just inside the top edge
  const ref = (2 * W + Math.floor(W / 2)) * 4;
  const [br, bgG, bb] = [p[ref], p[ref + 1], p[ref + 2]];
  const TOL = 10;
  const isBg = (k: number) =>
    Math.abs(p[k] - br) <= TOL && Math.abs(p[k + 1] - bgG) <= TOL && Math.abs(p[k + 2] - bb) <= TOL;

  // Flood-fill background from the edges
  const bg = new Uint8Array(W * H);
  const stack: number[] = [];
  const push = (i: number, j: number) => {
    if (i < 0 || j < 0 || i >= W || j >= H) return;
    const n = j * W + i;
    if (bg[n] || !isBg(n * 4)) return;
    bg[n] = 1;
    stack.push(n);
  };
  for (let i = 0; i < W; i++) { push(i, 0); push(i, H - 1); }
  for (let j = 0; j < H; j++) { push(0, j); push(W - 1, j); }
  while (stack.length) {
    const n = stack.pop()!;
    const i = n % W, j = (n / W) | 0;
    push(i + 1, j); push(i - 1, j); push(i, j + 1); push(i, j - 1);
  }

  // Label the remaining shapes and keep the largest (the jester)
  const comp = new Int32Array(W * H).fill(-1);
  const sizes: number[] = [];
  for (let n = 0; n < W * H; n++) {
    if (bg[n] || comp[n] >= 0) continue;
    const id = sizes.length;
    let size = 0;
    const q = [n];
    comp[n] = id;
    while (q.length) {
      const m = q.pop()!;
      size++;
      const i = m % W, j = (m / W) | 0;
      for (let dj = -1; dj <= 1; dj++) {
        for (let di = -1; di <= 1; di++) {
          const a = i + di, b = j + dj;
          if (a < 0 || b < 0 || a >= W || b >= H) continue;
          const mm = b * W + a;
          if (bg[mm] || comp[mm] >= 0) continue;
          comp[mm] = id;
          q.push(mm);
        }
      }
    }
    sizes.push(size);
  }
  if (!sizes.length) return null;
  const keep = sizes.indexOf(Math.max(...sizes));

  // Clear everything else and find the jester's bounds
  let l = W, t = H, r = -1, b = -1;
  for (let n = 0; n < W * H; n++) {
    if (comp[n] !== keep) {
      p[n * 4 + 3] = 0;
    } else {
      const i = n % W, j = (n / W) | 0;
      if (i < l) l = i;
      if (i > r) r = i;
      if (j < t) t = j;
      if (j > b) b = j;
    }
  }

  const work = document.createElement('canvas');
  work.width = W;
  work.height = H;
  work.getContext('2d')!.putImageData(img, 0, 0);

  const out = document.createElement('canvas');
  out.width = r - l + 1;
  out.height = b - t + 1;
  out.getContext('2d')!.drawImage(work, l, t, out.width, out.height, 0, 0, out.width, out.height);
  return out.toDataURL('image/png');
}

let cached: string | null | undefined;

/** Data URL of the jester (transparent PNG), or null until ready / if unavailable. */
export function useJesterImage(): string | null {
  const [url, setUrl] = useState<string | null>(cached ?? null);
  useEffect(() => {
    if (cached === undefined) {
      try {
        cached = extractJester();
      } catch {
        cached = null;
      }
    }
    setUrl(cached);
  }, []);
  return url;
}
