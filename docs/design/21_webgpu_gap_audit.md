# 21 · WebGPU 检索计划 · 反查补漏

**版本：** **v2**（R3 后）· 取代 v1 为现行反查  
**日期：** 2026-07-23  
**对照：** 计划 `20` **v0.4** · R1 `20_webgpu_r1_findings` · 源卡 `wg_*` · L0 R3 代码 · changelog `2026-07-23_webgpu_r3_preference` · `CURRENT` · `19` · `04`  
**目的：** R3 落地后计划/文档/代码是否一致；剩余缺口能否关检索轨；**驱动 `20` → v0.5**。  
**跟进：** 计划已升 **`20` v0.5**（本报告驱动）。

**v1（R1 后）摘要：** 目标过满、D-WG1 两义、deployment 15、禁 canvas、device.lost 必接 → 已驱动 v0.3；R3 部分已落地。v1 细节见 git 历史；**认 v2**。

---

## 0. 一句话总判

> **代码已按「优先 WebGPU + WebGL 回退 + device.lost→D28」跑在 D-WG1b 工程态；文献外搜仍可停。**  
> 计划 **v0.4 严重滞后 L0**：§0 仍写「不预设立场默认」、§2 仍写 `preference:'webgl'`、非目标仍写「未过门禁改默认」——与现行实现矛盾。  
> **真正未关的不是再检索，而是：**  
> ① **P0 观感对照表空**（无 🔴/✅）  
> ② **Capacitor 真机空**  
> ③ **L2 文档未同步**（`19` 仍写「不 WebGPU 回退」；`04`/`10` 无 Dx）  
> ④ **P-iOS 未钉**（部署 15 vs GPU 26+）  
> 下一主路径 = **人工 P0 表 + R4 真机 + 文档结案**，禁止再开选型/外搜周。

---

## 1. v1 缺口迁移表（R3 后）

| v1 缺口 | v1 | v2（R3 后） | 备注 |
|---------|----|-------------|------|
| 目标「必须首选」过满 | 🔴 | 🟡 **产品已选优先**；计划文案未改 | 改计划 §0 对齐 L0 |
| D-WG1 两义 | 🔴 | ✅ 工程 = **1b**（数组链默认） | 缺正式 Dx |
| flag 命名混乱 | 🟡 | ✅ `?renderer=` + localStorage | |
| 禁 canvas 链 | 🟡 | ✅ `['webgpu','webgl']` | 仅 log 警告，无硬失败 UI |
| device.lost 接线 | 🟡 | ✅ `app.ts` + `main` rehydrate | 未真机/模拟 lost 验证 |
| deployment 15 | 🔴 | 🔴 **仍在** | 约束叙事不变 |
| P0 效果实测 | 🔴 | 🔴 **仍空** | **主阻塞** |
| Capacitor 真机 | 🔴 | 🔴 **仍空** | R4 |
| 计划 §12 过期 | 🔴 | 🟡 v0.4 已改但仍滞后 L0 架构段 | v0.5 修 |
| 外搜 | 停 | **仍停** | |

---

## 2. 计划 v0.4 声称 vs L0 现实

| # | v0.4 文本 | L0 现实 | 判定 |
|---|-----------|---------|------|
| §0 目标 | 「评估可选/渐进」「**不预设立场**必须首选」 | 默认 **已是** WebGPU 优先 | 🔴 **文案与产品/L0 冲突** |
| §0 非目标 | 「未过门禁改默认 preference」 | R3 **已改默认** | 🔴 过时禁令 |
| §1.2 关闭条件 | API 映射落地未勾 | preference 链 + lost **已落地** | 🟡 应勾代码项，留观感/真机 |
| §2 架构钉 | `preference 今日 = 'webgl' 硬编码` | `resolveRendererPreference` → 默认 webgpu 链 | 🔴 **事实错误** |
| §7.1 Flag | 缺省 → webgl | 缺省 → **webgpu** | 🔴 |
| §8 未结案 | 曾写保持 webgl 默认 | 工程默认 1b | 🟡 v0.4 后半已改，§2 未跟 |
| §9 R3 | 代码 ✅ · 观感 ⏳ | 同左 | ✅ 准确 |
| `19` D28 | 「不双引擎、**不 WebGPU 回退**」 | **有** WebGPU 优先 + WebGL 回退 | 🔴 **L2 过时** |
| `04` D28 | 仅「新 WebGL」 | 新 **WebGL 或 WebGPU** | 🟡 措辞窄 |
| `10` 选型 | 未提后端偏好 | L0 已双后端 | 🟡 结案补 |
| README | 未提 `?renderer=` | 开发者不知 A/B | 🟡 |
| NOTES_PACK | 可能未列 20/21 | 导航漏 | 🟡 |

---

## 3. 与代码对照 · 关键补漏（R3 专项）

### 3.1 ✅ 已对齐（不必重做）

| 项 | L0 |
|----|-----|
| 默认 `['webgpu','webgl']` | `rendererPreference.ts` |
| `?renderer=` / `localStorage.card_renderer` | 同上 |
| `webgpu` 与 `auto` 同链 | `preferenceFor` |
| `renderer.name` 日志 + bundle.backend | `app.ts` / `GameView.backend` |
| webglcontextlost → onContextLost | `app.ts` |
| device.lost（非 destroyed）→ 同回调 | `app.ts` |
| onContextLost → `runResumeRehydrate` | `main.ts` |
| rehydrate 重建时重挂 lost | `createPixiApp` 每次新建 |
| destroy 设 `destroying` 防重入 | `app.ts` |
| core / PHYS 未污染 | 抽查 |

### 3.2 🟡 实现半成品 / 边角

| 缺口 | 说明 | 优先级 |
|------|------|--------|
| **G1 无玩家可见错误** | 双后端都失败时 Pixi throw → 仅 `main` catch 红字 pre；无「回退说明」HUD | P1 |
| **G2 非 webgl/webgpu 仅 console.error** | 未 `throw` / 未强制 destroy | P2 |
| **G3 lost 与 resume 双触发** | 前台 device.lost 与随后 appState resume 可能 **连续两次 rehydrate**（有 queue，可接受但费电） | P2 真机观察 |
| **G4 isWebGPUSupported 模块缓存** | 同页生命周期缓存；一般 OK | P2 |
| **G5 单测薄** | 仅 default 无 window；无 jsdom 测 `?renderer=` | P2 |
| **G6 无 dev HUD 显示 backend** | 仅 console；调参时易忘 A/B | P2 可选 |
| **G7 包体 Q-A9** | 未跑 build 分析 webgpu chunk | P2 |
| **G8 等价画法预案** | H2 若 🔴 时的预烘焙圆角 **无规格草稿** | P1 若截图失败再开 |

### 3.3 🔴 门禁空（阻塞「检索结案 / 正式 Dx」）

| 缺口 | 关闭标准 |
|------|----------|
| **G9 P0 观感表** | §3.0 每行 ✅/🟡/🔴；至少 Chrome 一行 WebGPU + 一行 `?renderer=webgl` |
| **G10 Capacitor** | `navigator.gpu`、实际 backend、一局、后台 10s；iOS 版本注明 |
| **G11 P-iOS** | 产品一句：维持 15 渐进 / 抬版本 / 双轨文案 |
| **G12 L2 同步** | `19` 删「不 WebGPU 回退」；D28 改为 GPU 无关措辞；`04` 或新 **D29** 钉默认偏好 |

### 3.4 🟡 产品 / 决策

| 点 | 现状 |
|----|------|
| 工程态 | **D-WG1b**（默认 webgpu 链） |
| 正式决策 | **未**写入 `04`/`10` |
| 风险 | 在 **未填 P0 表** 时已改默认 = 接受「先上后验」；回滚路径 = `?renderer=webgl` 或改 default |
| D-WG2 | 仍不满足（部署 15、无真机绿、无 P0 表） |

---

## 4. 假设表（R3 后）

| H | v0.4 | v2 |
|---|------|-----|
| H1 正确 preference 链可跑通 | 待证 | 🟡 **代码路径通**；可玩性靠 P0 表 |
| H2 mask/半透明 | 待证 | 🔴 仍待截图 |
| H3 appState + device.lost | 设计 | 🟡 **已接线**；真机 lost 未证 |
| H4 Capacitor 无 GPU | 倾向 | 🔴 仍开 |
| H5 性能 | 低权 | ➖ 不阻 1b |
| H6 deployment 15 渐进 | 约束 | ✅ 仍成立；与 1b 兼容（老机 WebGL） |
| H7 数组禁 canvas | 约束 | ✅ 已实现 |

---

## 5. 问题表状态（Q-A*）

| Q | v2 状态 |
|---|---------|
| Q-A1 官方 Experimental | ✅ 文献关 |
| Q-A2 回退 / 禁 canvas | 🟡 **代码关**；需一次 console 日志存证 |
| Q-A3 Safari 26+ | ✅ 文献 |
| Q-A3b / P-iOS | 🔴 |
| Q-A4 Capacitor | 🔴 |
| Q-A5 Android | ✅ 搁置 |
| Q-A6 antialias | 🟡 归入 P0 V09 |
| Q-A7 device lost 设计 | 🟡 接线 ✅ · 实测 🔴 |
| Q-A8 rehydrate 耗时 | 🔴 |
| Q-A9 包体 | 🔴 |
| Q-A10 device.lost 可订阅 | 🟡 代码路径有；运行时未贴日志 |

---

## 6. 检索该停吗？

| 轨 | 判决 |
|----|------|
| 外搜 / 新源卡 | ✅ **停**（与 v1 同） |
| R3 编码 | ✅ **主 diff 完成** |
| **观感 + 真机 + L2 文档** | 🔴 **唯一剩余** |
| 再改 preference 架构 | ➖ 除非 P0 出现 🔴 |

**反查结论：T-WG「文献+架构检索」可标结案条件中的代码子集已满足；「保效果」检索门禁未满足，因零实测。**  
勿用新检索代替填表。

---

## 7. 对计划 v0.5 的强制修改清单

| # | 修改 | P |
|---|------|---|
| 1 | §0 改为：**产品已定优先 WebGPU（工程 D-WG1b）**；检索剩余 = 验保效果与真机 | P0 |
| 2 | 删除/改写「未过门禁禁止改默认」→ **已改默认；回滚=`webgl`；结案前风险自担** | P0 |
| 3 | §2 preference 钉改为 L0 真值 + `rendererPreference.ts` | P0 |
| 4 | §1.2 勾选：API/lost **代码 ✅**；观感/真机/Dx 分列 | P0 |
| 5 | §7.1 缺省 = webgpu 链 | P0 |
| 6 | §8 工程默认 **1b**；正式 Dx 待 G9–G12 | P0 |
| 7 | §9/§12：下一主路径 **P0 表 + R4 + 文档三件套（19/04/CURRENT 已有一行）** | P0 |
| 8 | 链到本反查 **v2**；changelog R3 | P1 |
| 9 | 附录：已知边角 G1–G8 | P1 |
| 10 | 建议结案时改 `19` 一句 + D28/D29 措辞（执行可在 R5） | P1 |

---

## 8. 修订后执行顺序

```text
1. 人工：npm run dev → 记 backend= 
   + ?renderer=webgl A/B → 填 20 §3.0 表（G9）
2. 若 P0 无 🔴：保持 1b；若有 🔴：临时 default webgl 或修等价画法
3. R4 Capacitor（G10）+ 注明 iOS 版本
4. P-iOS 一句话（G11）
5. R5：19/04/10 补丁 + 有效源 List + 可选 README 一行（G12）
```

**超时：** 若 P0 长期空，**诚实状态 = 工程 1b 未验收**，不得宣称「效果已验证」。

---

## 9. 证据与可信度

| 源 | 用途 |
|----|------|
| L0 R3 代码 | 最高：默认链 / lost |
| changelog R3 | 实现纪要 |
| R1 源卡 | 平台文献仍有效 |
| v0.4 计划 | **部分过时**（本反查指出） |
| 观感/真机 | **缺失** |

---

## 附录 A · L0 锚点（反查时）

```text
src/render/rendererPreference.ts  default ['webgpu','webgl']
src/render/app.ts                 preference + device.lost + webglcontextlost
src/render/gameView.ts            onContextLost 贯穿 mount/rehydrate
src/main.ts                       onGpuLost → runResumeRehydrate
ios/.../project.pbxproj           IPHONEOS_DEPLOYMENT_TARGET = 15.0
docs/design/19                    仍写「不 WebGPU 回退」← 过时
```

## 附录 B · 修订记录

| 版本 | 日期 | 变更 |
|------|------|------|
| v1 | 2026-07-23 | R1 后；驱动 20 v0.3 |
| **v2** | **2026-07-23** | **R3 后；文案/L0 对齐；G9–G12 主阻塞；驱动 20 v0.5** |
