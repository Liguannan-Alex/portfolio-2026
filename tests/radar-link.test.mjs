import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const radarPath = '/radar/#catalog';

test('主页提供独立且安全的招商线索雷达入口', async () => {
  const [configSource, navigationSource] = await Promise.all([
    readFile(new URL('../src/config.ts', import.meta.url), 'utf8'),
    readFile(new URL('../src/sections/Navigation.tsx', import.meta.url), 'utf8'),
  ]);

  assert.match(configSource, /ctaText:\s*"联系我 Contact"/);
  assert.match(configSource, /radarCtaText:\s*"招商线索雷达 ↗"/);
  assert.ok(configSource.includes(`radarCtaHref: "${radarPath}"`));
  assert.match(navigationSource, /href=\{navigationConfig\.radarCtaHref\}/);
  assert.match(navigationSource, /target="_blank"/);
  assert.match(navigationSource, /rel="noopener noreferrer"/);
  assert.match(navigationSource, /className="nav-cta-button"/);
});

test('雷达快照可从 PiGuannan 的 /radar/ 独立分享', async () => {
  const radarRoot = new URL('../public/radar/', import.meta.url);
  const indexSource = await readFile(new URL('index.html', radarRoot), 'utf8');

  assert.match(indexSource, /<link rel="canonical" href="https:\/\/piguannan\.com\/radar\/">/);
  assert.match(indexSource, /<meta property="og:url" content="https:\/\/piguannan\.com\/radar\/">/);
  assert.match(indexSource, /<meta property="og:image" content="https:\/\/piguannan\.com\/radar\/assets\/og\.png">/);
  assert.match(indexSource, /<a href="#catalog">核验网络<\/a>/);
  assert.match(indexSource, /48 个信源核验网络/);
  assert.match(indexSource, /id="open-company-library"/);
  assert.match(indexSource, /19 条可追溯依据关联/);
  assert.doesNotMatch(indexSource, /25 条项目依据关联|全量依据库|48 个平台入口/);

  for (const asset of ['assets/styles.css', 'assets/demo-data.js', 'assets/catalog-data.js', 'assets/app.js', 'assets/og.png']) {
    const assetStat = await stat(new URL(asset, radarRoot));
    assert.ok(assetStat.size > 0, `${asset} 不应为空`);
  }
});

test('雷达把可追溯依据和待定位账号线索分开计数', async () => {
  const source = await readFile(new URL('../public/radar/assets/demo-data.js', import.meta.url), 'utf8');
  const context = { window: {} };
  vm.runInNewContext(source, context);
  const data = context.window.__HENGDIAN_PAGES_DEMO__;
  const evidence = data.projects.flatMap((project) => project.evidence);
  const leadRecords = data.projects.flatMap((project) => project.leadRecords || []);

  assert.equal(data.evidenceCount, 19);
  assert.equal(data.originalMaterialCount, 5);
  assert.equal(evidence.length, 19);
  assert.equal(new Set(evidence.map((item) => item.url)).size, 5);
  assert.equal(leadRecords.length, 6);
  assert.ok(leadRecords.every((item) => item.countsAsEvidence === false));
  assert.ok(evidence.every((item) => item.url !== 'https://www.sina.cn/media/7927216783'));
});
