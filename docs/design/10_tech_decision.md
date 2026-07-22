# 10 · 技术方案选型结论（T5）

**状态：** 已拍板（检索后）  
**更新：** 2026-07-21  
**依据：** `09_tech_research_plan.md` + `research/tech-stack/`  
**关联：** D15 / D16 / D17 见 `04`；视口 `11`；反查 `12`（第二轮）；计划 **`09` v3 检索结案**

---

## 1. 选型结论（摘要）

| 项 | 决定 |
|----|------|
| **主渲染** | **PixiJS v8**（单引擎，不与 Three 混用） |
| **版本锚点** | `pixi.js` **8.19.0**（npm latest @ 2026-07-21；建议 `^8.19.0`；脚手架 `npm create pixi.js@latest`） |
| **UI** | **DOM 叠在 phone-frame 内**（按钮 / 结算 / 设置）；牌桌与飞牌在 Canvas |
| **坐标** | **设计分辨率 393 × 852**（iPhone 15 CSS 逻辑像素） |
| **PC 预览** | 自建 **phone-frame letterbox**（非依赖 DevTools 唯一验收） |
| **输入** | **逻辑层 hit-test 优先** + 可选引擎顶层拾取校验 |
| **逻辑 / 渲染** | 纯 TS 核心可单测；渲染仅订阅状态 |
| **暂缓** | 原生 App、广告 SDK、完整 CI |

---

## 2. 对比证据表（填完）

| 维度 | 权重 | Three.js 正交 2D | PixiJS v8 | 证据 |
|------|------|------------------|-----------|------|
| 2D 精灵 / 牌点击 | 高 | 可行；Raycaster + Mesh 更稳，Sprite 有 center/scale 坑 | **原生 2D 事件**；`eventMode` + 树遍历取顶层 | T1 three；T4 pixi 官方 |
| 层叠 / z 排序 | 中 | `position.z` / renderOrder；负 near 与 ray 冲突 | `zIndex` / 子节点顺序清晰 | T1 three；T4 |
| 图集 / 合批 / 移动端 | 高 | 可做；2D 非主战场 | **spritesheet 合批≤16 纹理**；关 antialias；少 mask | ✅ T6 官方 tips |
| 翻面 / 飞走动画 | 中 | 真 3D 翻面易，但过重 | **scale.x 伪翻面 + ticker 飞走足够** | 产品仅轻 juice；POC 验 |
| 文本 | 低 | Text/Canvas | BitmapText / Text；HUD 用 DOM | 双方够用 |
| DOM UI 混排 | 中 | 需坐标同步 | 同，CSS 叠 frame 即可 | 架构选择 |
| 包体 / 首屏 | 中 | gzip≈182KB（bundlephobia full） | gzip≈251KB（full） | 🟡 全量旁证；**Vite 实测待 T6-M4**；不因包体改引擎 |
| 团队熟悉度 | 高 | Three 生态熟 | **Yaran 已用 Pixi ^8.14 + AssetPack** | ✅ T6-P4 内部盘点 |
| 文档生态 2024–26 | 中 | 强（3D） | v8 文档 + AI skills + open-games | T1/T2 |
| 仅 2D 永不 3D | 中 | 略重 | **更贴** | 产品约束 |
| 以后 2.5D juice | 低 | 更易 | 滤镜/shader 够用 | 低权重 |
| 同类开源模板 | 中 | Memory 等偏少 | **Solitaire / Match3 / open-games** | T2 |
| PC 手机框 | 高 | 与引擎无关 | 与引擎无关 | T3 → `11` |
| iPhone 15 Safari | 高 | WebGL 通用坑 | 同 | T3 → `11` |

**拍板规则应用：**

1. 主引擎只选一个 → **Pixi**  
2. 技术分：2D 点击 / 模板 / 贴合度 Pixi 领先  
3. 熟悉度：原估 Three 更高；**T6 发现 Yaran 已是 Pixi v8**，爬坡更低  
4. 若未来强依赖真 3D 牌桌 → 逻辑层不动，可评估迁 Three；**原型不做双引擎**

---

## 3. 否决 / 降级理由（Three 作主引擎）

| 否决项 | 原因 |
|--------|------|
| Three 正交 2D 作主渲染 | 为 2D 牌游戏承担正交相机、Sprite 拾取、z 与 ray 一致性成本，收益低 |
| Three + Pixi 双引擎 | 包体、生命周期、事件双份；违背「主引擎只一个」 |
| 全量 UI 画在 Canvas | 结算/设置用 DOM 更快；phone-frame 内 absolute 即可 |
| 仅依赖 Chrome Device Mode | 不能替代自建 393:852 letterbox 与安全区模拟 |

**Three 保留用途：** 团队知识、未来若做 2.5D 宣传镜头可另开实验分支；**不写入 MVP 依赖**。

---

## 4. 输入与遮挡（T4 结论）

### 4.1 推荐策略：**逻辑 hit-test 优先**

玩法「被盖 = 不可点」由 **规则几何**（占位矩形重叠阈值）决定，不是 GPU 像素 alpha。

```text
pointer (clientX, clientY)
  → 映射到设计坐标 (dx, dy) ∈ 393×852
  → freeCards = 逻辑层当前可点集合（未遮挡 + 抽出叠顶 + …）
  → 在 freeCards 中按 z/层序从高到低做 AABB 包含测试
  → 取第一张 → dispatch SelectCard
  → 渲染层仅表现选中/飞走（不负责合法性）
```

### 4.2 引擎层角色

| 引擎 | 角色 |
|------|------|
| Pixi | 可选：仅对「逻辑已标 free」的牌开 `eventMode='static'`，盖牌 `none`；或全局 `pointertap` 只取坐标 |
| Three（若曾用） | `intersectObjects` 按 distance 排序；**仍须**逻辑过滤 free |

### 4.3 伪代码（引擎无关）

```ts
// pure logic — unit testable
function pickCard(state: LevelState, p: Vec2): CardId | null {
  const candidates = state.cards
    .filter(c => c.alive && isFree(state, c.id))
    .filter(c => aabbContains(c.rect, p))
    .sort((a, b) => b.z - a.z); // higher layer first
  return candidates[0]?.id ?? null;
}

function onPointerUp(client: Vec2) {
  const p = screenToDesign(client, viewport);
  const id = pickCard(store.state, p);
  if (id) store.dispatch({ type: 'TAP_CARD', id });
}
```

### 4.4 反模式

- 仅依赖 Pixi 顶层 hit 却不关盖牌的 `eventMode` → 半透明盖层可能误点  
- 仅 Three raycast 取最近 mesh，不校验 `isFree` → 与规则漂移  
- 用 `click` 不做 `touch-action: none` → 移动端滚动/延迟风险  

---

## 5. 架构草图

```text
┌─────────────────────────────────────────────┐
│  PC 浏览器 / iPhone Safari                    │
│  ┌─ #page-letterbox (灰/黑底) ─────────────┐ │
│  │  ┌─ #phone-frame 393:852 contain ─────┐ │ │
│  │  │  canvas (Pixi Application)         │ │ │
│  │  │  #hud (DOM: 撤销/抽牌/结算)         │ │ │
│  │  └────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘

src/
  core/          # 纯 TS：牌局状态、isFree、配对、抽洗、胜负
  data/          # levels JSON
  render/        # Pixi：贴图、层、动画、坐标同步
  ui/            # DOM HUD
  viewport/      # design 393×852、resize、safe-area
  main.ts
```

**原则：** `core` 零依赖 Pixi；Vitest 测规则；渲染可替换。

---

## 6. 依赖与脚手架（建议）

```bash
# 可选官方脚手架
npm create pixi.js@latest

# 或手动 Vite + TS
npm create vite@latest card-proto -- --template vanilla-ts
npm i pixi.js
npm i -D vitest
```

| 依赖 | 用途 |
|------|------|
| `pixi.js` **8.19.0**（`^8.19.0`） | 2D 渲染与 pointer |
| `vite` | 开发 / 构建 |
| `typescript` | 全项目 |
| `vitest` | core 单测 |
| （可选）`gsap` 或自写 tween | 飞牌缓动；POC 可 ticker 线性 |

**不做：** React/Vue 强绑（HUD 可用轻 DOM）；不引入 Phaser（过重且非必要）。

---

## 7. 目录脚手架（POC）

```text
card/
  index.html
  package.json
  vite.config.ts
  src/
    main.ts
    core/
      types.ts
      board.ts
      rules.ts
      pick.ts
    data/
      level01.json
    render/
      app.ts
      cards.ts
      anim.ts
    ui/
      hud.ts
    viewport/
      phoneFrame.ts
      design.ts
  docs/   # 已有
  research/
```

---

## 8. 风险与缓解

| 风险 | 缓解 |
|------|------|
| 团队 Pixi 不熟 | **缓解：Yaran 已用 v8**；再读 Events + open-games |
| iOS 冷启动 viewport / safe-area | 见 `11`；`viewport-fit=cover` + 真机清单 |
| WebGL context lost | 监听恢复；纹理重载钩子 |
| 全屏 hitArea 偏移 | resize 后重算 design 映射；T4 issue 提醒 |
| 包体未实测 | POC 打 production 体积对比记录 |
| 熟悉度诱惑回 Three | 逻辑已分离；禁止在 MVP 引入 three |

---

## 9. 与原型范围对齐（`08`）

POC 验收（引擎相关）：

- [ ] phone-frame 内可玩 4×5 + ≥2 盖层  
- [ ] 逻辑遮挡正确；误点盖牌为 0  
- [ ] 抽牌 / 洗回 / 配对动画可感知  
- [ ] PC 缩放窗口 letterbox 不裁切玩法区  
- [ ] iPhone 15 Safari 点选无系统性偏移  

**不在 POC：** 双引擎对比周、原生壳、广告。

---

## 10. 参考仓库（抄结构，不抄规则）

| 仓库 | 可抄 |
|------|------|
| [pixijs/open-games](https://github.com/pixijs/open-games) | TS 工程、资源管线、场景组织 |
| [s2031215/PixiJS-Solitaire](https://github.com/s2031215/PixiJS-Solitaire) | 纸牌点击 / 移动（v4 老 API 仅作玩法参考） |
| [gamedevland/match3](https://github.com/gamedevland/match3) | 网格精灵与输入循环 |
| Three Memory 等 | **不优先**；仅证明 Three 能做牌，非推荐路径 |

官方：

- Pixi Events: https://pixijs.com/8.x/guides/components/events  
- Three Raycaster: https://threejs.org/docs/#api/en/core/Raycaster.intersectObject  

---

## 11. 下一步

1. D15–D17 已锁定；**文献检索结案**（`09` v3 / `12` 第二轮）  
2. 按 **POC-1～6**（`09` §7）脚手架 + phone-frame + 层叠点选（**仅 Pixi 8.19**）  
3. 真机勾 `11`；`vite build` 记 `notes/bundle_size.md`  
4. 可选：NotebookLM 上传 tech sources  

**禁止**再开 Three/Pixi 选型检索周；**不默认写全量业务**，先最小可点。
