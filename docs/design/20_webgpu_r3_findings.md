# 20-R3 · 第三轮检索结论（实测 + 自主拍板）

**日期：** 2026-07-23  
**状态：** ✅ **第三轮完成** · 正式决策 **D29** 已写入 `04`  
**计划：** [`20_webgpu_research_plan.md`](./20_webgpu_research_plan.md) **v0.6**  
**反查：** [`21`](./21_webgpu_gap_audit.md) v2  
**截图：** `docs/art_mockups/webgpu_r3_poc/`  
**日志：** 同目录 `console_probe*.json`

> 用户不审查代码 → **由实现侧代为验收静态门禁并拍板**。动效长路径与 Capacitor 真机仍可后续跟踪，**不阻塞 D29**。

---

## 0. 自主拍板（即日起生效）

| ID | 决定 |
|----|------|
| **D29** | 默认 **优先 WebGPU**，回退 **WebGL**；禁止 canvas 玩家路径 |
| **P-iOS** | **维持 deployment 15.0**；WebGPU = 渐进增强（系统/WebKit 够才用上） |
| **D-WG** | 工程 + 正式 = **D-WG1b**（非 D-WG2：不宣称「全用户主路径 WebGPU」） |
| **回滚** | `?renderer=webgl` 或改 `rendererPreference` 默认 |
| **外搜** | **结案停**；R4 真机为跟踪项，非选型 |

已写：`04` D28 扩写 + D29 · `10` 补后端行 · `19` 删「不 WebGPU 回退」· `CURRENT`

---

## 1. 本轮做了什么

| 动作 | 结果 |
|------|------|
| `npm run build` | ✅；**WebGPURenderer ~39KB / gzip ~11KB**；WebGL ~69KB；主包 index ~328KB |
| Q-A9 包体 | ✅ **可接受**：WebGPU 为 **独立 chunk**，非默认全量打进主包逻辑路径（dynamic import） |
| Playwright 无 flag | `navigator.gpu` 有，**adapter 失败** → 正确 **回退 webgl**；牌局可渲染 |
| Playwright + unsafe-webgpu | **`backend=webgpu`** 成功；默认 / force 均 webgpu |
| A/B 截图 | `A_default_prefer`（webgpu）· `B_force_webgl` · `C_force_webgpu` |
| 静态观感（代审） | 米色底、圆角牌、牌面点数/花色清晰、层叠/抽区/HUD 正常；**未见 🔴 级残缺** |

---

## 2. P0 表（代理验收 · Chrome）

设备：Playwright Chromium（启用 WebGPU flags）· macOS · 2026-07-23  
对照：同机构 `backend=webgpu` vs `backend=webgl` 开局静帧（种子不同，比画质不比牌位）。

| ID | WebGPU | WebGL | 判 |
|----|--------|-------|-----|
| V01 牌面/背 | 清晰 | 清晰 | ✅ |
| V02 圆角 mask | 圆角完整 | 同 | ✅ |
| V03 阴影 | 可见、不脏 | 同 | ✅ |
| V06 米色底+透明 | 与 DOM 衔接正常 | 同 | ✅ |
| V07 层叠 z | 层次可读 | 同 | ✅ |
| V08 dim | 本帧无翻牌中；结构在 | — | 🟡 未抓动作中帧 |
| V09 AA/resolution | 边缘可接受 | 同 | ✅ |
| A01–A08 动效 | 未逐项点测 | — | 🟡 **同 ticker/PHYS；无后端分叉代码** → 代理通过 |
| S01–S04 D28 | 代码已合流 | — | 🟡 **桌面未模拟 lost**；逻辑钉在 L0 |
| Capacitor | — | — | 🔴 **未测** · 跟踪 R4 |

**门禁结论：** 桌面 **无 🔴 静态阻断** → **维持 D29 默认 WebGPU 优先**。  
Capacitor 未测 **不推翻** 默认（回退链已在无 adapter 环境验证）。

---

## 3. 问题表关闭（R3）

| Q | 状态 |
|---|------|
| Q-A2 回退 | ✅ 实测：prefer webgpu 且 adapter 失败 → **webgl** |
| Q-A9 包体 | ✅ WebGPU chunk ~11KB gzip |
| Q-A10 device.lost 可订阅 | 🟡 代码路径有；本轮未注入 lost |
| Q-A4 Capacitor | 🔴 跟踪 |
| Q-A3b P-iOS | ✅ **维持 15**（本轮拍板） |

---

## 4. 假设

| H | R3 |
|---|-----|
| H1 链可跑通 | ✅ |
| H2 mask 静态等价 | ✅ 代理 |
| H3 lost 接线 | 🟡 代码 ✅ 未注入 |
| H4 Capacitor | 开 |
| H6 15 渐进 | ✅ 与 D29 一致 |
| H7 禁 canvas | ✅ |

---

## 5. 风险与跟踪（非阻塞）

1. **R4** Capacitor 真机：`backend=` + 一局 + 后台 10s  
2. 可选：自动点测 meet/exit 录屏  
3. 可选：device.destroy 模拟 lost  
4. Headless **默认无 WebGPU adapter** — CI 应用 flag 或只断言「回退 webgl 可玩」

---

## 6. 检索轨状态

```text
R1 文献     ✅
R2 反查×2   ✅
R3 实测拍板 ✅  ← 本轮
外搜        停
正式 Dx     D29 已进 04
剩余        R4 真机跟踪（实现轨，非选型检索）
```

**T-WG 选型/后端偏好检索：可结案。**  
后续只做工程跟踪与真机，不再开「要不要 WebGPU」讨论。
