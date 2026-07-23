# 2026-07-23 · Capacitor iOS + 基础震动

## 目的

Web 配对牌 → 真机 iOS 体验；消除/抽牌/点选带 Haptics。

## 依赖

- `@capacitor/core` / `@capacitor/cli` / `@capacitor/ios` / `@capacitor/haptics`

## 配置

| 文件 | 说明 |
|------|------|
| `capacitor.config.ts` | appId `com.cardpair.mvp` · appName 配对牌 · webDir `dist` |
| `vite.config.ts` | `base: './'`（Capacitor 相对路径） |
| `src/native/haptics.ts` | 震动封装（Web 无感） |
| `src/styles.css` | `body.native-app` 全屏安全区 |

## 震动映射

| 事件 | 强度 |
|------|------|
| 配对消除 | Heavy |
| 抽牌 | Medium |
| 点选 / 弹回 | Light |
| 胜利 | Success notification |

## 打包到手机

**Agent 约定：** 用户说「打包」时执行完整流程并打开 Xcode：

```bash
npm run build
npx cap sync ios
npx cap open ios
# 等价：npm run cap:ios
```

Xcode：选真机（iPhone 15 Pro）→ Signing（个人 Team）→ Run。

**iPhone-only 清单：** 见 `2026-07-23_ios_iphone_checklist.md`。
