# 2026-07-23 · iOS 真机上线与适配总整理（项目笔记权威）

**状态：** 已实现 · 已推 `origin/main`（含 `098739b` 等）  
**锚点机型：** **iPhone 15 / 15 Pro**（逻辑 **393×852** @3x）  
**范围：** Capacitor 壳、震动、真机布局、动画裁切、画面放大、iPhone-only 配置  
**读者：** 新会话优先读本文 + `ios_iphone_checklist` + `native_shell_layout`

---

## 0. 一句话

**Web 配对牌用 Capacitor 打到 iPhone；等比全屏铺满、米色壳、FX 不裁动画；仅 iPhone 竖屏；「打包」= build + sync + 开 Xcode。**

---

## 1. 产品与工程决策

| ID / 约定 | 内容 |
|-----------|------|
| 设备 | **仅 iPhone**（`TARGETED_DEVICE_FAMILY=1`），不做 Android 验收 |
| 分辨率 | 设计坐标 **393×852**（15/15 Pro）；Max 只 contain 不改坐标 |
| 方向 | **仅竖屏** |
| 调参面板 | **真机 / 窄屏不挂载** |
| Agent「打包」 | `npm run build` → `npx cap sync ios` → `npx cap open ios` |

---

## 2. 分主题改动

### 2.1 Capacitor + 震动

| 项 | 说明 |
|----|------|
| 依赖 | `@capacitor/core` · `cli` · `ios` · `haptics`（Cap 8） |
| 配置 | `capacitor.config.ts`：`com.cardpair.mvp` · 配对牌 · `webDir: dist` |
| Vite | `base: './'` |
| 震动 | 消 Heavy · 抽 Medium · 点选/弹回 Light · 胜 Success |
| 代码 | `src/native/haptics.ts` · `main.ts` |
| 分条 | `2026-07-23_capacitor_ios.md` |

### 2.2 真机布局（黑边 / 压扁）

| 根因 | 修法 |
|------|------|
| `contentInset: automatic` 内缩露黑 | 改为 **`never`**，WebView 全铺 |
| frame 非 393:852 拉伸 | **JS `shellLayout`** 等比 contain；禁止 100% 硬拉满 |
| 窗口黑底 | AppDelegate / Launch **米色 `#efe5d9`** |

| 文件 | 作用 |
|------|------|
| `src/viewport/shellLayout.ts` | visualViewport 量屏 + 设 frame px |
| `src/render/app.ts` | 先 shell 再 Pixi resize |
| `src/styles.css` | native cream / overflow |
| `capacitor.config.ts` | contentInset never · backgroundColor |
| 分条 | `2026-07-23_native_shell_layout.md` |

### 2.3 画面放大（留白过多）

| 之前 | 现在 |
|------|------|
| 游戏框先扣 full safe-area 再 contain → 15 Pro 约 0.89 缩放 | 对 **整屏 visualViewport** 等比 contain（≈1.0） |
| 安全区 | **只约束 HUD**（顶栏/底栏 `env(safe-area-inset-*)`） |

### 2.4 动画不被裁切

| 根因 | 修法 |
|------|------|
| Pixi 严格 393×852，飞出即 WebGL 裁切 | **`FX_PAD_X=96` / `FX_PAD_Y=220`** 缓冲画布 |
| | `world` 偏移；canvas CSS 大于 frame 并居中 |
| | `overflow: visible`；`exitOffPad` 加大 |

| 文件 | `design.ts` · `app.ts` · `phys.ts` · `styles.css` |

### 2.5 iPhone-only 清单项

| 项 | 状态 |
|----|------|
| 设备族仅 iPhone | ✅ |
| 竖屏 · UIRequiresFullScreen | ✅ |
| ITSAppUsesNonExemptEncryption=false | ✅ |
| 禁橡皮筋 / 长按菜单 | ✅ |
| 后台 ticker 暂停 | ✅ |
| 真机隐藏调参 | ✅ |
| 分条 | `2026-07-23_ios_iphone_checklist.md` |

---

## 3. 日常打包

```bash
npm run build && npx cap sync ios && npx cap open ios
# 或 npm run cap:ios
```

Xcode：选 **iPhone 15 Pro** → Signing → Run。

---

## 4. 文件总表（实现）

| 路径 | 角色 |
|------|------|
| `capacitor.config.ts` | Cap 配置 |
| `ios/` | 原生工程（已入库） |
| `src/native/haptics.ts` | 震动 |
| `src/viewport/shellLayout.ts` | 真机壳布局 |
| `src/viewport/design.ts` | 393×852 + FX buffer |
| `src/render/app.ts` | Pixi buffer + 缩放 |
| `src/main.ts` | native class · 震动 · 后台 ticker · 隐藏调参 |
| `src/styles.css` | native / HUD safe-area / overflow |
| `vite.config.ts` | `base: './'` |

---

## 5. 分条 changelog 索引

| 文档 | 主题 |
|------|------|
| **本文** | **iOS 总整理** |
| `2026-07-23_capacitor_ios.md` | Cap + 震动 |
| `2026-07-23_native_shell_layout.md` | 黑边/压扁/FX 裁切 |
| `2026-07-23_ios_iphone_checklist.md` | 打包与适配清单 |
| `docs/design/11_viewport_iphone15.md` | 视口规范（D16） |

---

## 6. 未做 / 上架前

- App Icon 全套与商店截图  
- 隐私政策 / TestFlight  
- StatusBar 插件精细控制  
- 进后台存局（现仅停 ticker）  
- Pro Max 专项（仅 contain，不改设计）  

---

## 7. 提交参考

| Commit（示例） | 主题 |
|----------------|------|
| `ad4f3e5` | Capacitor iOS + haptics |
| `098739b` | shell layout · FX bleed · iPhone-only · 放大画面 |
