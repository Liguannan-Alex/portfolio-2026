import type { Input } from './driving';

/** Recompute from held pointers so releasing one finger cannot erase another. */
export function combineTouchInput(held: Iterable<Partial<Input>>): Input {
  let throttle = 0, steer = 0, brake = false;
  for (const input of held) {
    throttle += input.throttle ?? 0;
    steer += input.steer ?? 0;
    brake ||= input.brake ?? false;
  }
  return {
    throttle: brake ? 0 : Math.max(-1, Math.min(1, throttle)),
    steer: Math.max(-1, Math.min(1, steer)),
    brake,
  };
}
