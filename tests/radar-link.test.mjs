import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const radarUrl = 'https://liguannan-alex.github.io/hengdian-lead-radar-demo/#catalog';

test('主页提供独立且安全的招商线索雷达入口', async () => {
  const [configSource, navigationSource] = await Promise.all([
    readFile(new URL('../src/config.ts', import.meta.url), 'utf8'),
    readFile(new URL('../src/sections/Navigation.tsx', import.meta.url), 'utf8'),
  ]);

  assert.match(configSource, /ctaText:\s*"招商线索雷达 ↗"/);
  assert.ok(configSource.includes(`ctaHref: "${radarUrl}"`));
  assert.match(navigationSource, /href=\{navigationConfig\.ctaHref\}/);
  assert.match(navigationSource, /target="_blank"/);
  assert.match(navigationSource, /rel="noopener noreferrer"/);
  assert.match(navigationSource, /className="nav-cta-button"/);
});
