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

## 2026-09-05 场景内履历
用户确认：经过年份自动看到摘要，点击物件展开详情，连续翻阅后原地驾驶。
- 10 条真实履历逐一映射到档案箱；2022 直播设备、2024—2025 卡牌采用专用物件。
- 新增区域限定/滞回的摘要、独立物件点击、开箱/镜头阅读、年份导航；读内容不依赖外跳。
- 阅读期间驾驶暂停并清理输入，返回保持车位。全屏弹窗使用片场根节点，手机阅读分区。
- 25 项单元测试、TypeScript、静态/Sites 构建通过。电脑/手机/667×375 横屏阅读、自动摘要、全10段翻阅、开箱、点击/拖动/取消、全屏、原地返回、地图/作品切换和无 WebGL 回退全部通过。最终截图与验证脚本在 piguannan-pixel-design/career-exhibit/。
