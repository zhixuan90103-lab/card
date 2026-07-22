# T6 检索轮次综合

**日期：** 2026-07-21  
**范围：** T6-P1～P5 + 版本/包体旁证（非 Vite 实测）  
**决策影响：** **不推翻 D15–D17**；强化 Pixi 选型（内部已用 v8）

---

## 1. 条目状态

| ID | 主题 | 状态 | 产出 |
|----|------|------|------|
| T6-P1 | 移动端性能 | ✅ 文献+官方 | `t6_pixi_mobile_perf` + `t6_official_perf_atlas` |
| T6-P2 | 图集/纹理 | ✅ 官方+限制 | 同上 + `t6_texture_limit`（`t6_atlas` 噪声，旁证） |
| T6-P3 | 层叠 Web 实现 | 🟡 有仓库 | `t6_layered_match`：麻将/纸牌层叠参考 |
| T6-P4 | 内部复用 | ✅ 盘点 | `notes/t6_internal_reuse.md` |
| T6-P5 | phone-frame 组件 | ✅ 有候选 | `t6_phone_frame_lib`；**仍推荐自建** |
| T6-P6 | NotebookLM | ⏭ 未做 | 可选 |
| T6-M1 | 钉版本 | 🟡 **建议钉 8.19.0** | 待 `package.json` 落地 |
| T6-M2～M5 | POC/真机/build | 🔴 | **实现阶段** |

---

## 2. 关键结论更新

### 性能（P1）

- 官方：图集、合批顺序、移动端关 antialias、hitArea、少 mask/filter。  
- 社区：v8 有 VRAM/大容器移动等 issue → **控制纹理与 interactive 节点**。  
- 本案牌量低，**风险可控**；真机帧率仍属 T6-M5。

### 图集（P2）

- 用 **spritesheet JSON** 或 AssetPack。  
- iOS 常见 max texture **4096**；扑克一图集轻松。  
- 与 D17：交互矩形独立于纹理 alpha。

### 层叠参考（P3）

| 参考 | 可抄 |
|------|------|
| green-mahjong 等 HTML 麻将 | 层叠可点判定思路 |
| Pixi Solitaire（T2） | 纸牌飞牌 |
| fmahjongg (Three) | **不优先**（3D） |
| SO 可解布局生成 | 关卡工具二期 |

**遮挡算法：** 仍以本案 `layer + 矩形相交阈值` 为准（规则文档），外部仅作实现灵感。

### phone-frame（P5）

- 开源：`html5-device-frame`、`device-mockup`、mobileviewer 等 → **展示向**居多。  
- **维持 11 自建 CSS contain**；可选日后套 bezel 皮肤。

### 内部（P4）· **重大发现**

- **Yaran 已是 Pixi v8 + AssetPack** → 熟悉度论据从「偏 Three」修正为「Pixi 有现成项目」。  
- Bag：`safe-area` + `visualViewport` 可抄。

### 版本 / 包体

- 推荐依赖：`pixi.js@8.19.0`（或 `^8.19.0`）  
- bundlephobia：pixi gzip ~251KB vs three ~182KB → **包体非选 Three 理由**；以玩法贴合为准。

---

## 3. 对 10 文档的补丁意图

1. 版本锚点改为 **8.19.0**  
2. 团队熟悉度行：注明 **Yaran 已用 Pixi 8**  
3. 性能/图集行：引用官方 tips  
4. 包体：写入 bundlephobia 旁证 + 仍待 Vite 实测  

---

## 4. 仍须实现才能关闭的项（→ `09` v3 **POC-1～6**）

- POC-1 钉 package 版本  
- POC-2 phone-frame 可运行页  
- POC-3 isFree + AABB 单测  
- POC-4 本仓库 `vite build` 体积  
- POC-5 真机清单 / 帧率观感  
- POC-6 scale.x 翻面手感  

**2026-07-21 第二轮反查：** 文献检索结案；上表不再称为「检索缺口」。 
