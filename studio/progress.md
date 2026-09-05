Original prompt: 就是像素的清晰度还是不如 bruno 那个

2026-09-05: Improve clarity without changing the authored world or controls.
- Found missing MSAA on EffectComposer render targets, DPR cap 1.5, stale composer DPR after quality changes and an always-on blur pass.
- Added 4x MSAA bounded by device support, DPR cap 2 shared by renderer/composer, removed blur, enabled texture anisotropy and foliage alpha-to-coverage.
- Validation passed: desktop DPR 2 and mobile DPR 3 both render at DPR 2 with 4 MSAA samples; quality toggles and showcase resize keep compositor/canvas buffers matched; no browser errors. All 17 tests pass; static and Sites builds pass.
- Mobile now defaults to high quality; the existing quality toggle is visible on phones.
- Before/after screenshots and verification results are stored locally under piguannan-pixel-design/clarity/.
