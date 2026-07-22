---
title: T4 官方摘录 · 输入与命中（Pixi Events + Three Raycaster）
date: 2026-07-21
type: tech
generated_by: manual-curation
---

# T4 · 官方与一手文档摘录

> 补充 Grok 自动检索笔记；关键句来自官方页面（2026-07-21 抓取）。

## 1. PixiJS v8 Events / Interaction

**URL:** https://pixijs.com/8.x/guides/components/events

### eventMode

| Mode | 行为 |
|------|------|
| `none` | 自身与子节点均不参与交互 |
| `passive` | **默认**；自身不 hit-test、不发事件，**子节点仍可交互** |
| `auto` | 仅当祖先 interactive 时参与 hit-test，不发事件 |
| `static` | 参与 hit-test 并发事件；适合按钮/静止牌 |
| `dynamic` | 同 static，指针空闲时仍收合成事件；适合移动目标 |

### Hit testing（官方语义）

输入发生时，Pixi **沿显示树寻找指针下最顶层的 interactive 对象**：

- `interactiveChildren === false` → 跳过该容器子树  
- 设置了 `hitArea` → **覆盖** bounds 命中  
- `eventMode === 'none'` → 自身与子树跳过  

找到顶层目标后派发事件；可冒泡。推荐 pointer 事件：`pointerdown` / `pointertap` 等。

### 对本项目的含义

- 牌用 `eventMode = 'static'` + 矩形 `hitArea` 即可。  
- **引擎默认取顶层**，适合「看得见就能点」的 UI。  
- **玩法遮挡**（下层被盖不可点）**不能只靠引擎**，因半透明/空隙/逻辑覆盖与视觉 bounds 可能不一致 → 需逻辑层 `isFree` 过滤（见 `10_tech_decision.md`）。

---

## 2. Three.js Raycaster.intersectObject(s)

**URL:** https://threejs.org/docs/#api/en/core/Raycaster.intersectObject

官方约定：

- `intersectObjects` 返回的交点按 **distance 从近到远排序**（最近/最前优先）。  
- 可递归检测子节点。  

### 正交 2D 坑（T1 社区证据汇总）

- `OrthographicCamera` 使用 **negative near** 时，`setFromCamera` 常失效或与 z 层叠冲突。  
- `Sprite` raycast 对 `center` / `scale` 支持不完整（历史 issue）。  
- 2D UI 层叠用 `position.z` 时，需手动保证 ray 方向与 near/far 合法。  
- Issue #16031：排序按距离，**不一定等于 renderOrder**。

### 对本项目的含义

Three 能做 2D 点选，但比 Pixi 多一层「正交 + Sprite/Mesh + z」调参成本；牌量虽小（≪200），**工程负担在正确性而非帧率**。

---

## 3. 逻辑命中 vs 引擎拾取（架构共识）

T4 检索（AABB / logic vs render）与 2D 游戏惯例一致：

- **碰撞/可选集** 在逻辑世界用 AABB + 排序维护。  
- **渲染** 只镜像位置与贴图。  
- 指针：屏幕坐标 → 设计坐标 → 逻辑 hit-test → 再驱动动画。

本项目「遮挡 = 规则」而非「像素 alpha 点穿」，**逻辑 hit-test 优先** 是强推荐。
