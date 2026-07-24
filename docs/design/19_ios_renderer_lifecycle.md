# 19 · iOS 渲染生命周期（状态为权威 · WebView 可丢弃）

**更新：** 2026-07-24  
**状态：** 现行 · 已定 **D28 / D30**  
**权威级：** **L2** 系统设计  
**实现（L0）：** `src/main.ts` · `src/core/state.ts` · `src/native/appLifecycle.ts` · `src/render/gameView.ts` · `ios/App/App/SceneDelegate.swift` · `ios/App/App/AppViewController.swift`  
**关联：** D15 Pixi · D16 393x852 · D29 WebGPU-first · [`04_decisions_log`](./04_decisions_log.md) · L4 [`renderer_rehydrate`](../changelog/2026-07-23_renderer_rehydrate.md) · L4 [`ios_scene_bridge_rebuild`](../changelog/2026-07-24_ios_scene_bridge_rebuild.md)  
**入口：** [`CURRENT`](../CURRENT.md) · [`NOTES_PACK`](../NOTES_PACK.md)

---

## 0. 结论

这次白屏不是 WebGPU、Pixi、背景层级或动画细节问题。

最终根因判断：**iOS WKWebView / WebContent 在 scene snapshot / foreground 恢复后，GPU canvas 的系统合成层可能失效；JS、触摸、Haptics 和游戏逻辑仍然活着，但旧 WebView 的显示层不可靠。**

因此设计升级为：

```text
GameState / GameSession      = 唯一权威，可序列化，可跨前后台恢复
Native resume snapshot       = iOS 前后台恢复依据
WKWebView / Capacitor Bridge = 可丢弃视图实例
Pixi Application / Texture   = 可丢弃 GPU 视图实例
```

iOS native resume **不修复旧 canvas，不 reload 旧页面，不信任旧 WKWebView**。  
正确策略是：**SceneDelegate 重建 root AppViewController，创建新的 Capacitor Bridge / WKWebView，Web 冷启动后从快照恢复同一局。**

---

## 1. 事故现象与证据链

### 1.1 玩家可见现象

App 进后台再回前台后，游戏画面变成白屏或浅色底。用户仍能点击，且能触发震动。

### 1.2 排除项

| 假设 | 证据 | 结论 |
|------|------|------|
| WebGPU 后端坏 | WebGL 时代也出现过同类白屏 | 排除 WebGPU 专属 |
| Pixi 背景盖住内容 | 背景临时改黑白条后仍白屏 | 排除背景层级 |
| JS 崩溃 / 游戏未运行 | 白屏时仍能触发 Haptics | JS 和逻辑仍活 |
| canvas 尺寸 0x0 | 日志出现 `canvasCss=393px 852px client=393 852` | 排除常规布局尺寸 |
| Pixi rehydrate 失败 | 日志出现 `rehydrate done` 但仍白 | 排除纯 Pixi 初始化 |
| 页面状态坏 | `window.location.reload()` 后 `restored=native-snapshot` 仍白 | 排除 JS 页面状态 |
| 只需重建 Bridge | AppDelegate 重建 Bridge 后仍有白屏 | 需要进入正式 Scene 生命周期 |

关键系统日志包括：

```text
Snapshot request ... error ... scene snapshotting operation
WebProcess::markAllLayersVolatile ...
`UIScene` lifecycle will soon be required
```

这些都指向 iOS scene / WebContent / layer 恢复，而不是业务逻辑。

---

## 2. 设计原则

### 2.1 强制原则

| 层 | 设计要求 |
|----|----------|
| GameSession | 规则、局面、undo、run 信息必须可快照化 |
| Renderer | Pixi Application / Texture / canvas 不持有业务语义 |
| WebView | iOS 前后台恢复时可整体丢弃 |
| Lifecycle | Web 与 iOS native 分路径处理，不混用 |
| Quality | 不通过牺牲动画、降级视觉或改 WebGPU-first 来修复 |

### 2.2 禁止

- 禁止把 iOS 白屏继续当偶发 BUG，用延迟、补帧、z-index 反复修。
- 禁止 iOS native resume 同时执行 `window.location.reload()` 和 native Bridge rebuild。
- 禁止依赖旧 WKWebView 内的 GPU canvas 自愈。
- 禁止在可能失效的旧 canvas 上继续绑定输入、ticker 或渲染闭包。
- 禁止把 WebGPU 降级成 WebGL 当作根治方案。

### 2.3 允许

- Web / desktop resume 继续走 `GameView.rehydrate(state)`。
- iOS native resume 走 `SceneDelegate` 重建 Bridge / WKWebView。
- WebGPU-first 继续作为玩家默认路径。
- 本地快照只作为前后台恢复机制，不等同长期存档系统。

---

## 3. 状态机

### 3.1 Web / desktop

```text
mount(state)
   v
 LIVE
   | tab hidden / pagehide / GPU lost
   v
 SUSPENDED
   | visible / pageshow
   v
 REHYDRATE
   | destroy GPU -> reload textures -> create Pixi -> bootstrap(state)
   v
 LIVE
```

### 3.2 iOS native

```text
LIVE
  | appStateChange(false) / sceneDidEnterBackground
  v
SNAPSHOT_SAVED
  | sceneWillEnterForeground
  v
BRIDGE_REBUILDING
  | new AppViewController -> new Capacitor Bridge -> new WKWebView
  v
WEB_COLD_START
  | read localStorage snapshot -> GameSession.fromSnapshot(...)
  v
LIVE
```

---

## 4. 模块职责

| 模块 | 职责 | 禁止 |
|------|------|------|
| `GameSession` | 规则与局面；`snapshot()` / `fromSnapshot()` | 持有 Sprite / Texture |
| `main.ts` | 持有 session；native 保存快照；Web resume rehydrate | native resume reload 页面 |
| `appLifecycle.ts` | 合并 Capacitor / visibility / pageshow 信号 | 直接重建 WebView |
| `GameView` | `mount` / `suspend` / `rehydrate(state)` / `destroy` | 持久化业务状态 |
| `createPixiApp` | 单次 GPU Application 创建；canvas 布局 | 假定 canvas 跨 iOS scene 恢复可靠 |
| `AppViewController` | 单个 Capacitor Bridge / WKWebView 容器 | 存游戏状态 |
| `SceneDelegate` | iOS scene 生命周期；回前台重建 root controller | 与 JS reload 双路径抢恢复 |

---

## 5. iOS 恢复流程（D30）

1. JS 侧 `appStateChange(false)` 调用 `persistNativeSnapshot()`。
2. 快照写入 `localStorage.card.nativeResumeSnapshot.v1`，包含：
   - `runIndex`
   - `runSeed`
   - `difficulty`
   - `drawsWithoutMatch`
   - `softTipShown`
   - `lastWon`
   - `GameSessionSnapshot`
3. `SceneDelegate.sceneDidEnterBackground` 标记 `enteredBackground = true`。
4. `SceneDelegate.sceneWillEnterForeground` 替换：

```swift
window.rootViewController = AppViewController()
```

5. 新 `AppViewController` 创建新的 Capacitor Bridge / WKWebView。
6. Web 冷启动读取 native resume snapshot。
7. `replayRun(seed, difficulty)` 重建同一局关卡定义。
8. `GameSession.fromSnapshot(level, snapshot.session)` 恢复局面。
9. 新 Pixi renderer mount，继续 WebGPU-first。

期望日志：

```text
[lifecycle] scene bridge rebuilt after background
[card-mvp] ... restored=native-snapshot
```

不应再出现：

```text
`UIScene` lifecycle will soon be required
[lifecycle] native resume reload from snapshot
```

---

## 6. Web rehydrate 流程（D28 保留）

Web / desktop 仍使用 `GameView.rehydrate(state)`：

1. `tearDownGpu`
2. `reloadCardFaceAssets`
3. `createPixiApp`
4. `CardRenderer.bootstrap(state)`
5. `rebindView`
6. `bindPointer(canvas)`
7. `refresh`

这条路径用于浏览器 tab 切换、WebGL context lost、WebGPU device lost，不作为 iOS native 前后台恢复的根治方案。

---

## 7. 验收清单

| # | 步骤 | 期望 |
|---|------|------|
| 1 | iPhone 真机玩几手 -> 后台 >=5s -> 回前台 | 画面恢复，牌面可见，可继续操作 |
| 2 | 快速切后台/前台 3 次 | 不白屏，不崩溃，最终可操作 |
| 3 | 拖牌中切后台再回 | 无幽灵拖拽，牌回正确座位 |
| 4 | 回前台后消一对 | 动画与震动正常 |
| 5 | Xcode 控制台 | 见 `scene bridge rebuilt after background` |
| 6 | Web 冷启动日志 | 见 `restored=native-snapshot` |
| 7 | Xcode 顶部警告 | 不再见 `UIScene lifecycle will soon be required` |

---

## 8. 经验钉

这次问题的正确抽象不是“canvas 白屏 BUG”，而是：

```text
iOS 上任何 GPU canvas 所在的 WKWebView 都是易失视图。
游戏工程必须能在不信任旧 WebView 的前提下恢复当前局。
```

后续所有渲染重构都必须遵守：

- 游戏状态先行。
- 渲染器可丢弃。
- WebView 可丢弃。
- iOS scene 是恢复边界。
- 不用降低动画细节换稳定性。
