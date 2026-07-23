# 19 · 渲染生命周期（视图可丢弃 · 状态为权威）

**更新：** 2026-07-23  
**状态：** 现行 · 已定 **D28**  
**权威级：** **L2** 系统设计  
**实现（L0）：** `src/render/gameView.ts` · `src/native/appLifecycle.ts` · `src/render/cardAssets.ts` · `src/main.ts`  
**关联：** D15 Pixi · D16 393×852 · [`04_decisions_log`](./04_decisions_log.md) · L4 [`renderer_rehydrate`](../changelog/2026-07-23_renderer_rehydrate.md)  
**入口：** [`CURRENT`](../CURRENT.md) · [`NOTES_PACK`](../NOTES_PACK.md)

---

## 0. 从现象到设计（禁止再当「偶发 BUG」修）

### 0.1 玩家可见现象

App **进后台再回前台** → 只剩米色背景，**牌与 WebGL 层 UI 空白**；DOM HUD 可能仍在，或整框若布局被写坏也会像「只有底色」。

### 0.2 根因分层（设计约束，不是补丁列表）

| 层 | 事实 | 错误做法 | 正确做法 |
|----|------|----------|----------|
| iOS WKWebView | 后台常 **丢失 WebGL context** | 假定 context 可恢复 | **不信任** 旧 Application |
| GPU 资源 | 贴图 / program / FBO 失效 | `ticker.start()` + `render` 补帧 | **销毁并重建** 视图 |
| 贴图缓存 | CPU `Image` 可留，GPU `Texture` 不可留 | 继续用旧 `Texture` | `reloadCardFaceAssets()` 重烘焙 |
| 输入 | `canvas` 是 DOM 节点，随 Application 新建 | 指针监听绑一次旧 canvas | **rehydrate 后 rebind** |
| 生命周期信号 | 仅 `visibilitychange` 在原生不可靠 | 只听 document | **Capacitor `appStateChange` + visibility + pageshow** |
| 视口 | 后台 `visualViewport` 可 0×0 | 写入 0 把 frame 缩没 | `shellLayout` 保留 lastGood，resume 再量 |

### 0.3 设计原则（强制）

```text
GameState / GameSession     = 唯一权威（跨 suspend 存活，可序列化）
Pixi Application + 贴图
  + CardRenderer + PileTray = 易失视图（可随时销毁，无会话语义）

suspend  → 停 ticker；丢弃进行中的 drag；不读写 GL
resume   → rehydrate(state)：
             tearDown GPU
           → reload GPU textures from CPU cache
           → createPixiApp()
           → bootstrap(state)
           → rebind pointer
           → refresh HUD
```

**禁止：**

- 在可能已失 context 的 GL 上「补几帧 render」当作恢复方案  
- rehydrate 后仍用旧 `canvas` / 旧 `app.ticker` 闭包（必须 `rebindView`）  
- 把「空白屏」记成零散 changelog 而不升格为生命周期状态机  

**允许：**

- 桌面与原生走**同一条** rehydrate 路径（简单 > 双路径优化）  
- rehydrate 串行队列 + generation，防连切后台竞态  

---

## 1. 状态机

```text
              mount(state)
                   │
                   v
              ┌─────────┐
         ┌───►│  LIVE   │◄── rehydrate 完成 + 输入已 rebind
         │    └────┬────┘
         │         │ app 进后台 / tab hidden / pagehide
         │         v
         │    ┌─────────┐
         │    │SUSPENDED│  ticker.stop；GameSession 不动
         │    └────┬────┘
         │         │ app 回前台 / visible / pageshow / appState active
         │         v
         │    ┌─────────┐
         └────│REHYDRATE│  串行：destroy → reload tex → create → bootstrap
              └─────────┘
```

中间态 **REHYDRATE** 可被更新的 generation 取消；只保留最后一次结果。

---

## 2. 模块职责

| 模块 | 职责 | 禁止 |
|------|------|------|
| `GameSession` | 规则与局面；可 undo | 持有 Sprite / Texture |
| `cardAssets` | CPU `imageCache` + GPU `textureCache`；`reloadCardFaceAssets()` | 假定 Texture 跨 context 有效 |
| `createPixiApp` | **单次** Application 挂载；context lost 只告警 | soft resume 整盘恢复 |
| **`GameView`** | `mount` / `suspend` / **`rehydrate(state)`** / `destroy` | 持久化业务状态 |
| `appLifecycle` | 合并原生 + web 前后台信号 | 直接碰 Pixi |
| `main` | 持有 session；resume 调 rehydrate；**rebind 指针**；`refreshHud` | 在旧 canvas 上听事件 |

---

## 3. 实现钉（代码契约）

### 3.1 信号源（`src/native/appLifecycle.ts`）

| 源 | 平台 | 用途 |
|----|------|------|
| `@capacitor/app` `appStateChange` | **iOS 权威** | isActive false→suspend / true→resume |
| `document.visibilitychange` | web + 辅助 | hidden / visible |
| `pageshow` / `pagehide` | bfcache | 冷恢复 |

多源 resume **合并去抖**（短 delay），避免连触发三次完整重建 thrash；若重建中又 resume，则 **queued 再跑一轮**。

### 3.2 rehydrate 顺序（`GameView`）

1. `tearDownGpu`：pileTray + `app.destroy` + **强制清空** `#game-canvas`  
2. `reloadCardFaceAssets()`：`destroy` 旧 Texture → 从 `imageCache` 重 bake  
3. `createPixiApp()`：新 canvas 进 host  
4. 新 `PileTray` + `CardRenderer` → `bootstrap(state)`  
5. `forcePresent`（layout + ticker + render）；rAF / 80ms / 280ms 再 settle 视口  

### 3.3 main 在 rehydrate 之后必须做

```text
rebindView()           // cards / app / canvas 指向新实例
bindPointer(canvas)    // 监听挂在新 canvas 上
activeDrag = null
refresh()              // sync 牌 + HUD
```

**历史缺陷（已修）：** 曾只 `create` 新 canvas，指针仍绑在已移除的旧 canvas → 即使画面修好也无法点；或只 soft resume 导致只见背景。

### 3.4 贴图

- 启动：`loadCardFaceAssets`（网络/本地 Image → bake）  
- 每次 rehydrate：`reloadCardFaceAssets`（**不**重新下图，若 cache 已有）  
- `Texture.destroy(true)` 只丢 GPU/canvas bake，**不**丢 `imageCache`  

---

## 4. 验收（真机 · iPhone）

| # | 步骤 | 期望 |
|---|------|------|
| 1 | 玩几手 → 切后台 ≥5s → 回前台 | 牌面 + 底栏按钮完整；可继续点消 |
| 2 | 快速连切后台 3 次 | 不空白、不崩、最终可操作 |
| 3 | 拖牌中切后台再回 | 无幽灵 drag；牌在正确座位 |
| 4 | 回前台后消一对 | 动画 + 震动正常 |
| 5 | 桌面 Chrome 切标签 | 同一 rehydrate 路径可恢复 |

调试：Safari Web Inspector / Xcode 控制台应见  
`[lifecycle] rehydrate start` → `rehydrate done`。

---

## 5. 文档角色（规范）

| 文档 | 角色 |
|------|------|
| **本文** | **生命周期设计权威**（问题已升格，不再当零散 bug） |
| `design/04` **D28** | 决策一行钉死 |
| `changelog/2026-07-23_renderer_rehydrate.md` | 实现与文件 diff 笔记 |
| `changelog/2026-07-23_ios_roundup.md` | iOS 总整理引用本节 |
| `00_INDEX.md` | 索引入口 |

**过时表述（勿再写进新文档）：**

- 「visibilitychange 时 resume ticker」当作完整方案（见旧 `11_viewport` 草稿句）  
- 「context restored → soft render」当作恢复策略  

---

## 6. 非目标

- 不在此做局内状态持久化到 disk（可后续另开设计）  
- 不双引擎、不 WebGPU 回退  
- 不做 Android 验收（产品仍 iPhone-only）  
