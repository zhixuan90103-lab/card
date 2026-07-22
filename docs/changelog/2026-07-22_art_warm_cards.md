# 2026-07-22 · 暖休闲美术：牌面 / 背景 / 按钮

**范围：** 表现层 only（`render/*` · `ui/hud` · `styles.css`）  
**未改：** core 规则、配点、锁、seed、几何常量

---

## 变更

| 项 | 内容 |
|----|------|
| 主题 | 新增 `src/render/theme.ts`（雾蓝背 / 乳白面 / 暖毡） |
| 牌面 | 中心大 rank + 双角花色；红 `#C62828` 黑 `#1A1A1A` |
| 背面 | 谜题雾蓝、库青灰；浅描边 + 极淡交叉纹 |
| 选中 | 金描边 + 上抬 4px |
| 背景 | phone-frame / Pixi `#F3E8DA`；letterbox 深棕 |
| 按钮 | 胶囊：抽蓝 / 撤陶土 / 重开米 / 新局绿 |
| 浮层 | 暖白卡片；硬死文案「暂时卡住了」 |
| 规格 | `research/art-ux/02_visual_spec.md` → v0.2 |

---

## 验证

```bash
npx vitest run
npx tsc --noEmit
```

本地：`npm run dev` 于 phone-frame 目视牌面扫 free 与底栏按钮。
