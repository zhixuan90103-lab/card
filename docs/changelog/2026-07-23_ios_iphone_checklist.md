# 2026-07-23 · iPhone-only：iOS 打包与适配调研清单

**范围：** 只做 iPhone（锚点 **iPhone 15 / 15 Pro · 393×852**），不用 Android 做验收。  
**栈：** Vite + Pixi8 WebGL + Capacitor 8 + Xcode 26  

---

## 1. 结论摘要

| 项 | 状态 | 说明 |
|----|------|------|
| 设计分辨率 393×852 | ✅ | 与 15 / 15 Pro 逻辑分辨率一致 |
| 等比 contain + 米色 letterbox | ✅ | `shellLayout` + cream 背景 |
| FX 缓冲防动画裁切 | ✅ | `FX_PAD_*` + buffer canvas |
| contentInset never | ✅ | 避免 WebView 内缩露黑 |
| 仅竖屏 | ✅ | Info.plist |
| **仅 iPhone 设备族** | ✅ 本次 | `TARGETED_DEVICE_FAMILY = 1` |
| 禁止橡皮筋滚动 | ✅ 本次 | `overscroll-behavior` / touch-callout |
| 后台停 ticker | ✅ 本次 | `visibilitychange` |
| 出口合规加密声明 | ✅ 本次 | `ITSAppUsesNonExemptEncryption=false` |
| 调参面板真机隐藏 | ✅ | 已有 |
| 震动 Haptics | ✅ | 配对/抽牌/点选/胜利 |
| App Store 图标多尺寸 | ⏳ | 现仅 1024 级一套，上架前要补 |
| 隐私政策 / 商店文案 | ⏳ | 上架前 |
| 崩溃监控 / 性能档 | ⏳ | 可选 |

---

## 2. 打包流程（日常）

```bash
# 用户说「打包」= 完整流程
npm run build
npx cap sync ios
npx cap open ios
# 等价：npm run cap:ios
```

Xcode：

1. Target **App** · Signing 选个人/公司 Team  
2. 真机选 **iPhone 15 Pro**  
3. Run；若「未受信任」→ 设置 → 通用 → VPN 与设备管理 → 信任  

改 Web 后必须 **build + sync** 再 Run，否则装的是旧 `public/`。

---

## 3. 适配注意事项（iPhone）

### 3.1 分辨率与机型

| 机型 | 逻辑 pt | 策略 |
|------|---------|------|
| **15 / 15 Pro（锚点）** | 393×852 | 设计坐标 1:1 映射 |
| SE / mini 等更矮 | 不同 | contain，上下米色条 |
| Pro Max | 430×932 | contain，两侧或上下条；**不改设计坐标** |
| iPad | — | **不支持**（设备族仅 1） |

### 3.2 安全区（Dynamic Island + Home 条）

典型 15 Pro 竖屏：`top≈59` · `bottom≈34` · 左右 0。

| 层 | 做法 |
|----|------|
| WebView | `contentInset: never` + `viewport-fit=cover` |
| **游戏框** | 对 **整屏 visualViewport 等比 contain**（不先扣 safe-area，否则留白过大） |
| **HUD 顶/底** | 仅文案/按钮用 `env(safe-area-inset-*)` 避让岛与 Home 条 |
| 窗口底色 | `#efe5d9`，禁止系统黑条 |

> 2026-07-23 调参：玩家反馈「留白太多」→ 取消「整框再减 safe-area」的双重留白。

### 3.3 动画与裁切

- 布局/点选：**393×852**  
- 渲染缓冲：**+ FX_PAD**（飞出可见）  
- `#phone-frame` `overflow: visible`；屏幕边由 letterbox 裁  

### 3.4 触摸与手感

- `touch-action: none` · 禁系统长按菜单  
- Capacitor `scrollEnabled: false`  
- Haptics：重=消 · 中=抽 · 轻=点选/弹回 · Success=胜  

### 3.5 性能（WKWebView + Pixi）

| 建议 | 现状 / 动作 |
|------|-------------|
| 分辨率 cap | `MAX_DPR=3`（15 Pro 正好 3） |
| 后台暂停 | `visibilitychange` → `ticker.stop` |
| 远程调试 | Mac Safari → 开发 → 你的 iPhone → App |
| 避免超大纹理 | 牌面已 bake；注意整屏截图分辨率 |

### 3.6 App Store / 审核（上架前）

| 点 | 要求 |
|----|------|
| **离线可玩** | 资源打进包，勿只加载线上页（Guideline 4.2） |
| **不是纯网页套壳** | 有完整玩法、震动等原生能力更稳 |
| **加密问卷** | `ITSAppUsesNonExemptEncryption=false`（仅 HTTPS） |
| **图标** | 准备全套 App Icon（含 1024） |
| **截图** | 6.7" / 6.1" 等按商店要求 |
| **隐私清单** | 若只用 Haptics，一般无敏感权限；加统计/广告再补 |

Capacitor 官方：iOS **15+**；Xcode **26+**（与当前环境一致）。

---

## 4. 已改代码（本调研落地）

| 文件 | 改动 |
|------|------|
| `project.pbxproj` | `TARGETED_DEVICE_FAMILY = 1`（仅 iPhone） |
| `Info.plist` | 去掉 iPad 横竖声明；`UIRequiresFullScreen`；加密声明 |
| `styles.css` | `overscroll-behavior` / 禁 callout |
| `main.ts` | 后台暂停 ticker |

---

## 5. 可选后续（非阻塞真机玩）

1. 启动图按 15 Pro 做一版纯色+ logo  
2. `@capacitor/status-bar` 统一状态栏样式  
3. 生命周期：进后台存局 / 回前台 resume（现仅停 ticker）  
4. 真机 Instruments 看 Pixi 帧时间  
5. TestFlight 内测流程  

---

## 6. 快速自检（15 Pro）

- [ ] 无底部大黑条；无整屏压扁  
- [ ] 顶栏不进岛；底按钮不进 Home 条  
- [ ] 消牌飞出不完全被切边  
- [ ] 震动有反馈  
- [ ] 调参面板不出现  
- [ ] 切后台再回，动画不卡死  
