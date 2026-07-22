# 2026-07-22 · 替换 Poker 牌面资源

**范围：** 表现层  
**未改：** core 规则 / 配点 / hit-test

---

## 资源

| 源 | `Downloads/Poker/` |
|----|---------------------|
| 入库 | `public/cards/` |
| 命名 | `R_{rank}.png` = 红♥ · `B_{rank}.png` = 黑♠ |
| 张数 | 26 面（A–10,J,Q,K × 红黑） |
| 尺寸 | 188×248 → 显示缩放到 52×72 |
| 背面 | `Card_B.png`（188×248；**现行：灰蓝皇冠剪影**，见 `drag_match_pile_shadow`） |

---

## 代码

| 文件 | 作用 |
|------|------|
| `src/render/cardAssets.ts` | Pixi `Assets.load` 26 face + 1 back |
| `src/render/cards.ts` | face/back 均为 `Sprite`；圆角 mask；选中金框 |
| `src/main.ts` | bootstrap 前 `await loadCardFaceAssets()` |

---

## 清晰度说明（为何资源清、游戏糙）

| 原因 | 处理 |
|------|------|
| 资源 188×248 被硬拉成 52×72（比例不同） | 槽位改为 **56×74**（同比例） |
| 非等比 `width/height` 拉伸 | `layoutSprite` 改为 **cover 居中** |
| 缩小采样 | `scaleMode=linear` + mipmaps |

预览时请硬刷新；在 Preview 里 1:1 看 PNG 像素远多于游戏里一张牌的屏幕像素，观感仍会有差，但不应再「糊成一块」。

## 验证

```bash
npm run dev
# 亮面/背面资源图；比例不扁；选中金边
```
