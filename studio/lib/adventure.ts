export const clamp = (n: number, min = 0, max = 1) => Math.min(max, Math.max(min, n));
const smoothstep = (n: number) => { const t = clamp(n); return t * t * (3 - 2 * t); };

/** A pure mapping from document position: no one-way triggers or stored progress. */
export function sampleJourney(y: number, starts: number[], viewport: number, documentHeight: number) {
  const height = Math.max(1, viewport);
  const position = clamp(y, 0, Math.max(0, documentHeight - height));
  const probe = position + height * 0.46;
  const weights = [1, 0, 0, 0];
  for (let i = 1; i < 4; i++) {
    const blend = smoothstep((probe - (starts[i] ?? Infinity) + height * 0.24) / (height * 0.48));
    for (let j = 0; j < i; j++) weights[j] *= 1 - blend;
    weights[i] = blend;
  }
  const active = weights.indexOf(Math.max(...weights));
  const from = starts[active] ?? 0;
  const to = starts[active + 1] ?? documentHeight;
  return {
    weights,
    active,
    progress: clamp(position / Math.max(1, documentHeight - height)),
    local: clamp((probe - from) / Math.max(height, to - from)),
    night: weights[1] * 0.3 + weights[2] * 0.68 + weights[3],
    transition: 1 - Math.max(...weights),
  };
}
