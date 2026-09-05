Original prompt: 就是像素的清晰度还是不如 bruno 那个

2026-09-05: Improve clarity without changing the authored world or controls.
- Found missing MSAA on EffectComposer render targets, DPR cap 1.5, stale composer DPR after quality changes and an always-on blur pass.
- Added 4x MSAA bounded by device support, DPR cap 2 shared by renderer/composer, removed blur, enabled texture anisotropy and foliage alpha-to-coverage.
- Validation passed: desktop DPR 2 and mobile DPR 3 both render at DPR 2 with 4 MSAA samples; quality toggles and showcase resize keep compositor/canvas buffers matched; no browser errors. All 17 tests pass; static and Sites builds pass.
- Mobile now defaults to high quality; the existing quality toggle is visible on phones.
- Before/after screenshots and verification results are stored locally under piguannan-pixel-design/clarity/.

- Final visual check found coplanar terrain caps: extrusion top y=-0.000000024 versus ground y=0. Lowered decorative island extrusion 3 cm to remove visible depth-fighting stripes; ground collider and drive surface stay at y=0.

## 2026-09-05 设备与操控方式
用户要求：自动识别电脑/手机；手机触屏操控小车，电脑键盘操控。
- 已复现宽屏触控平板无法显示驾驶按钮。
- 改为按 pointer/hover 和触点能力识别；实际触摸与驾驶按键支持切换混合设备的提示。
- 触控采用按 pointerId 聚合输入，双指前进和转弯互不抹除；加入刹车，暂停/失焦/取消触摸清空输入。
- 21 个单元测试已通过；电脑/窄窗口、手机竖横屏、宽屏平板、双指驾驶/部分松手/取消/刹车、地图/失焦/复位、外接键盘切换均通过浏览器验证，无控制台错误。
