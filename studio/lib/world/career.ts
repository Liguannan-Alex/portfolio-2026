import { content } from './content.ts';
import { careerStories } from './career-content.ts';
import type { Point } from './driving';

export const careerEntries = content.career.map((entry, index) => ({
  ...entry, ...careerStories[index], index, x: 3 + index * 2.8, z: -18.5,
}));
export function normalizeCareerIndex(index: number): number {
  if (!Number.isFinite(index)) return 0;
  return ((Math.trunc(index) % careerEntries.length) + careerEntries.length) % careerEntries.length;
}
export function findNearbyCareer(point: Point, previous: number | null = null): number | null {
  if (point.z < -20 || point.z > -9.8 || point.x < .5 || point.x > 31) return null;
  const distance = (index: number) => Math.hypot(point.x - careerEntries[index].x, point.z + 14.5);
  let nearest: number | null = null, best = 4.8;
  for (const entry of careerEntries) {
    const d = distance(entry.index);
    if (d < best) { nearest = entry.index; best = d; }
  }
  if (nearest !== null && previous !== null && careerEntries[previous] && distance(previous) < 4.8 && distance(previous) - best < .35) return previous;
  return nearest;
}
export const isCareerGround = (x: number, z: number) => x > .6 && x < 30.7 && z > -20.2 && z < -12.3;
