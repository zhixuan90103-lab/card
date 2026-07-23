# 2026-07-23 · 渲染生命周期重构（D28 / design 19）

**更新：** 2026-07-23  
**状态：** 现行 · 已实现  
**权威级：** **L4** 实现笔记  
**动机：** 后台回前台只见米色底；软 resume 无效。  
**权威设计（L2）：** [`design/19_ios_renderer_lifecycle.md`](../design/19_ios_renderer_lifecycle.md)  
**入口：** [`CURRENT`](../CURRENT.md) · [`NOTES_PACK`](../NOTES_PACK.md)

---

## 1. 把 BUG 变成设计

| 之前 | 之后 |
|------|------|
| 当偶发「黑屏/空白」补 `ticker.start` | **状态机**：LIVE / SUSPENDED / REHYDRATE |
| 假定 WebGL 可 soft 恢复 | **视图可丢弃**；`GameSession` 为权威 |
| 只听 `visibilitychange` | **Capacitor `appStateChange` + visibility + pageshow** |
| 指针监听绑一次 | **每次 rehydrate 后 rebind 新 canvas** |

---

## 2. 代码变更

| 文件 | 作用 |
|------|------|
| `src/render/gameView.ts` | `mount` / `suspend` / 串行 `rehydrate` + generation |
| `src/native/appLifecycle.ts` | 统一前后台信号（含 `@capacitor/app`） |
| `src/render/cardAssets.ts` | `imageCache` + `reloadCardFaceAssets` |
| `src/render/app.ts` | 单次 Application；context lost 告警；健壮 destroy |
| `src/main.ts` | resume → rehydrate → rebind 指针 → refresh |
| `package.json` | 依赖 `@capacitor/app` |

---

## 3. 关键修复点

1. **冷重建**：destroy Pixi → 重烘焙贴图 → 新 Application → `bootstrap(state)`  
2. **输入**：旧 canvas 已从 DOM 移除，必须 `bindPointer(view.canvas)`  
3. **原生信号**：仅 web 事件在 iOS 多任务下不可靠  
4. **竞态**：rehydrate 串行 + queued resume；generation 丢弃过期重建  

---

## 4. 验收

见 design 19 §4。打包：`npm run cap:ios`。

---

## 5. 与旧笔记关系

| 旧表述 | 处理 |
|--------|------|
| checklist「后台停 ticker」 | **保留 suspend**；恢复改为 **rehydrate**，不是 start ticker |
| roundup 未写生命周期 | **本文件 + design 19 补权威** |
