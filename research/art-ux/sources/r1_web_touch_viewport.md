# 参数卡 · Web 触控与视口（Safari / 手机框）

- 品类：移动 Web 工程
- 输入：pointer / touch
- 可信度：**高**（MDN + 本仓库 `11` 已定规范）
- 源：
  - MDN viewport / visualViewport / safe-area
  - `docs/design/11_viewport_iphone15.md`
  - 现状：`pointerdown` + `touch-action: none` + `env(safe-area-inset-*)`

| 项 | 观察值 | 备注 |
|----|--------|------|
| 300ms 点击延迟 | 现代用 pointer + `touch-action` 可规避 | 已用 pointerdown |
| visualViewport | 地址栏显隐改变可见区 | 需 resize 渲染（代码有钩子，真机未勾） |
| safe-area | top~59 / bottom~34（iPhone 15 竖） | HUD padding 已 `max(12px, env(...))` |
| 选中/消牌 | 与触控延迟解耦：先保证 **同帧感高亮** | 逻辑快于动画 |
| hit | D17 逻辑 AABB | 不靠 Pixi hitArea 定合法性 |
| 命中盒 | Support 可略放大视觉 | 可选 edge pad；未做 |
| 过关浮层 | 按钮需在 safe-area 内 | 浮层居中 + 底栏勿被 home 条挡 |
| 抽牌 | stock 可点区域含多层漏边宽 | main 已扩 stock 点击宽 |

**可迁移：**  
- R5 真机按 `11` §6 勾选  
- 浮层按钮 `padding-bottom: env(safe-area-inset-bottom)`  
- 保持 pointer；禁止依赖 300ms click  

**不可迁移：**  
- 原生 haptic 全套  
- Capacitor 壳（范围外）  

**对本产品：** 工程手感 **大半已就位**；缺口在 **真机验收 + 浮层 safe-area 细调**，非再检索理论。
