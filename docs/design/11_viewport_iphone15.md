# 11 · 视口规范：iPhone 15 + PC 手机框

**状态：** 已定（T3 复核）  
**更新：** 2026-07-21  
**决策：** D16；实现细节配合 `10_tech_decision.md`  
**源笔记：** `research/tech-stack/sources/t3_iphone15.md`、`t3_phone_frame.md`

---

## 1. 设计分辨率（逻辑坐标）

| 常量 | 值 | 说明 |
|------|-----|------|
| `DESIGN_WIDTH` | **393** | iPhone 15 / 15 Pro CSS 逻辑宽 |
| `DESIGN_HEIGHT` | **852** | iPhone 15 / 15 Pro CSS 逻辑高 |
| 比例 | **393:852** ≈ **9:19.5** | 竖屏 |
| 物理像素（参考） | 1179 × 2556 @3× | 仅 manifest/截图；**逻辑不用物理像素** |
| DPR | 3（真机） | 渲染时 `min(devicePixelRatio, MAX_DPR)` |

**Plus / Pro Max（430×932）** 本期不作为设计锚点；contain 进 393:852 框或后续扩展 `Extend` 策略。

游戏内一切布局、牌矩形、hit-test **只使用 393×852 设计坐标**。

---

## 2. 安全区（iPhone 15 系列竖屏）

检索共识（Dynamic Island 机型竖屏典型）：

| 边 | 典型 inset（CSS pt） |
|----|----------------------|
| top | **59**（Dynamic Island） |
| bottom | **34**（Home 指示条） |
| left / right | **0** |

横屏侧边对称 inset 存在，但 **本游戏默认竖屏**（不强制系统 lock；布局按竖屏设计）。

### CSS 要求

```html
<meta name="viewport"
  content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
```

PWA / 加主屏时建议：

```html
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
```

### 应用位置

- **HUD / 顶底按钮**：`padding` 使用 `env(safe-area-inset-*)`，建议 `max(12px, env(...))`  
- **牌桌核心区**：落在安全区内侧；不必整页 padding 挤扁 4×5  
- **PC 模拟**：phone-frame 内可选「模拟 notch」开关，固定 top 59 / bottom 34 占位条  

### 高度单位注意（iOS）

- Safari 地址栏显隐 → `100vh` / `visualViewport` 会变  
- 部分 PWA 冷启动：`100dvh` 与 standalone 行为不一致；指南倾向 **谨慎使用 100dvh**，必要时 JS 读 `visualViewport.height`  
- 监听：`visualViewport` 的 `resize` / `scroll`，触发 `resizeRenderer()`  

---

## 3. PC 手机框（letterbox）

### 3.1 结构

```text
html/body          深灰/黑底，overflow hidden
#letterbox         flex 居中，100vw × 100dvh
  #phone-frame     aspect-ratio: 393 / 852;
                   width/height: min 约束 contain
                   position: relative; overflow: hidden
    #game-canvas   绝对填满 frame
    #hud           绝对填满 frame；pointer-events 按控件
```

### 3.2 CSS 策略（推荐）

```css
#letterbox {
  width: 100vw;
  height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1a1a1a;
}

#phone-frame {
  aspect-ratio: 393 / 852;
  width: min(100vw, calc(100dvh * 393 / 852));
  height: min(100dvh, calc(100vw * 852 / 393));
  max-width: 100vw;
  max-height: 100dvh;
  position: relative;
  background: #000;
  /* 可选：圆角+细边模拟机身 */
  border-radius: 24px;
  box-shadow: 0 0 0 2px #333;
  overflow: hidden;
}

#game-canvas, #hud {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
#hud { pointer-events: none; }
#hud button, #hud .interactive { pointer-events: auto; }
```

等价现代写法：`aspect-ratio` + 父级 flex 居中；容器查询（`@container`）可选，非必须。

### 3.3 缩放语义

| 策略 | 选择 |
|------|------|
| 适配 | **contain**（完整 393:852 可见，两侧或上下黑边） |
| 裁切 | **禁止**对玩法区 cover |
| 逻辑坐标 | 始终 393×852；与 frame CSS 像素解耦 |
| 渲染缓冲 | `cssSize * min(dpr, MAX_DPR)`，`MAX_DPR` 建议 **2 或 3**（PC 4K 防过重） |

### 3.4 坐标映射

```ts
function screenToDesign(clientX: number, clientY: number, frame: DOMRect): Vec2 {
  const x = ((clientX - frame.left) / frame.width) * DESIGN_WIDTH;
  const y = ((clientY - frame.top) / frame.height) * DESIGN_HEIGHT;
  return { x, y };
}
```

Pixi：`resolution = dpr`；stage 或根容器 scale 使世界单位 = 设计像素（推荐 **1 世界单位 = 1 设计像素**，相机/ stage 尺寸 393×852）。

### 3.5 DevTools vs 自建框

| 方式 | 用途 |
|------|------|
| Chrome Device Mode iPhone 15 | 快速 UA/DPR 参考 |
| **自建 phone-frame** | **日常开发主预览**；与真机比例一致、可嵌 HUD |
| 真机 Safari | **验收必过** |

不强制 iframe 固定尺寸；同页 frame 更易调试。

---

## 4. 触摸与指针

| 项 | 规范 |
|----|------|
| 事件 | 优先 **Pointer Events**（Pixi `pointertap` / `pointerdown`） |
| CSS | canvas / frame：`touch-action: none`；`user-select: none` |
| 点击延迟 | 避免依赖 300ms `click`；用 pointer up + 逻辑 |
| 多指 | POC 单指；忽略额外 touch |
| 鼠标 | PC 同套 pointer，无分支复制逻辑 |

---

## 5. WebGL / Safari 风险清单

| 风险 | 动作 |
|------|------|
| context lost | `webglcontextlost` preventDefault + `webglcontextrestored` 重建纹理 |
| 后台回前 | **D28 / design 19**：suspend 停 ticker；resume **整视图 rehydrate**（非仅 resume ticker） |
| 内存 / 大图 | 牌图集；单纹理边长注意 iOS 上限（常见 4096） |
| 音频 | 需用户手势解锁（若有 SFX） |

---

## 6. iPhone 15 真机检查清单

### 6.1 布局

- [ ] 竖屏：牌桌与 HUD 不被 Dynamic Island / 底条永久遮挡  
- [ ] 地址栏显隐后 resize，牌桌不拉伸变形  
- [ ] 无横向溢出滚动  
- [ ] `viewport-fit=cover` 后安全区 padding 生效  

### 6.2 输入

- [ ] 点最上自由牌稳定命中  
- [ ] 盖牌不可点（逻辑）  
- [ ] 连续快抽 / 快消无错位累计  
- [ ] 边缘近安全区按钮可点  

### 6.3 性能

- [ ] 一关 ≤100 张牌时动画过程目视 ≥50fps 可接受  
- [ ] 首次加载贴图无明显卡死  
- [ ] 后台 1min 回前可继续  

### 6.4 PC 对照

- [ ] 拉大/缩小桌面窗口，frame contain 正确  
- [ ] 设计坐标 hit 与真机观感一致  
- [ ] DPR=1 与 DPR=2 窗口下均可玩  

---

## 7. 实现模块接口（建议）

```ts
// viewport/design.ts
export const DESIGN_WIDTH = 393;
export const DESIGN_HEIGHT = 852;
export const MAX_DPR = 3;

export type Viewport = {
  frameCss: { w: number; h: number };
  dpr: number;
  safe: { top: number; right: number; bottom: number; left: number };
};

export function bindPhoneFrame(root: HTMLElement, onChange: (v: Viewport) => void): () => void;
export function screenToDesign(clientX: number, clientY: number): { x: number; y: number };
```

---

## 8. 源链接（关键）

- iPhone 15 屏幕：https://useyourloaf.com/blog/iphone-15-screen-sizes/  
- PWA / safe-area：https://karmasakshi.medium.com/make-your-pwas-look-handsome-on-ios-fd8fdfcd5777  
- piclaw PWA 视口笔记：https://github.com/rcarmo/piclaw/blob/main/docs/PWA.md  
- CSS letterbox：https://stackoverflow.com/questions/53935670/…  
- Chrome 自定义设备：https://github.com/amirshnll/custom-device-emulation-chrome（393×852 @3）  

---

## 9. 与产品文档挂接

| 文档 | 关系 |
|------|------|
| `10_tech_decision.md` | 引擎与架构 |
| `08_prototype_scope.md` | POC 必须含 phone-frame |
| `02_game_rules.md` | 布局数据在设计坐标中解释 |
| `04_decisions_log.md` | D16 |
