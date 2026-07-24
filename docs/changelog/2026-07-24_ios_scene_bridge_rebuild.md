# 2026-07-24 · iOS 回前台白屏根治：SceneDelegate 重建 Bridge

**性质：** D30 · 把白屏 BUG 升级为生命周期设计  
**结论：** iOS native 前后台恢复不再信任旧 WKWebView / GPU canvas；回前台重建 Capacitor Bridge + WKWebView，并从游戏快照恢复。

---

## 现象

真机打包后：

- 覆盖安装后可正常游戏。
- 切后台再回前台后，画面变成纯白或浅色底。
- 白屏时仍能点击并触发 Haptics。
- 杀进程后再进也可能白屏。

---

## 排查收敛

| 阶段 | 操作 / 观察 | 结论 |
|------|-------------|------|
| WebGPU 怀疑 | 用户确认 WebGL 时代也有 | 不是 WebGPU 专属 |
| 背景层级怀疑 | 背景改黑白条后仍白 | 不是背景盖住 |
| Pixi rehydrate | 日志 `rehydrate done`，canvas 尺寸正常仍白 | 不是 Pixi 初始化失败 |
| JS 存活性 | 白屏时 Haptics 正常 | JS / 逻辑仍活 |
| 页面 reload | `window.location.reload()` 后 `restored=native-snapshot` 仍白 | 旧 WKWebView / WebContent 层仍不可靠 |
| AppDelegate rebuild | native Bridge rebuild 出现，但仍有白屏 | AppDelegate 与 scene snapshot 仍有竞态 |
| SceneDelegate rebuild | 正式接入 `UIApplicationSceneManifest`，回前台由 scene 重建 root controller | 问题解决 |

关键日志：

```text
Snapshot request ... scene snapshotting operation
WebProcess::markAllLayersVolatile ...
`UIScene` lifecycle will soon be required
```

---

## 根因判断

iOS WKWebView / WebContent 在后台 snapshot / foreground 恢复后，GPU canvas 的系统合成层可能失效。此时：

- JS 仍运行。
- 触摸仍到达。
- Haptics 正常。
- Pixi / WebGPU / WebGL 可能已经重新创建。
- 但旧 WebView / WebContent 显示层仍可能不提交可见画面。

所以只在 Web 层 `rehydrate` 或 `reload` 不足以根治。

---

## 修复设计

把 BUG 变成设计：

```text
GameSession = 权威状态
WKWebView / Bridge / Pixi / canvas = 易失视图
iOS scene resume = 丢弃旧视图并重建
```

iOS native 回前台流程：

1. JS 在 suspend 时保存 `NativeResumeSnapshot` 到 `localStorage`。
2. `SceneDelegate.sceneDidEnterBackground` 标记进入后台。
3. `SceneDelegate.sceneWillEnterForeground` 替换 root controller。
4. 新 `AppViewController` 创建新的 Capacitor Bridge / WKWebView。
5. Web 冷启动读取快照。
6. `GameSession.fromSnapshot` 恢复当前局。
7. 新 renderer mount，继续 WebGPU-first。

---

## 文件变更

| 文件 | 改动 |
|------|------|
| `src/core/state.ts` | 导出 `cloneState`；新增 `GameSessionSnapshot`、`snapshot()`、`fromSnapshot()` |
| `src/main.ts` | 新增 native resume snapshot；冷启动恢复；native resume 不再 `window.location.reload()` |
| `ios/App/App/AppViewController.swift` | 新增 `CAPBridgeViewController` 子类，统一 WKWebView 背景 |
| `ios/App/App/SceneDelegate.swift` | 新增 scene 生命周期；回前台重建 root `AppViewController` |
| `ios/App/App/Info.plist` | 新增 `UIApplicationSceneManifest` |
| `ios/App/App/Base.lproj/Main.storyboard` | 初始 controller 改为 `AppViewController` |
| `ios/App/App.xcodeproj/project.pbxproj` | 把新增 Swift 文件加入 Sources |

---

## 保留项

- Web / desktop 仍使用 D28 `GameView.rehydrate(state)`。
- WebGPU-first 策略不变。
- 不牺牲动画细节。
- 不把 WebGL fallback 当根治。

---

## 验收

真机验证通过：

- 后台再回前台，画面恢复。
- 当前局从快照恢复。
- 可继续操作与消除。

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
