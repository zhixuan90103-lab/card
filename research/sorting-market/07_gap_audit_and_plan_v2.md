# 反查补漏 + 修订检索计划 v2

**日期：** 2026-07-20  
**目的：** 对照交付目标与已完成检索，标缺口 → 改计划 → **三轮** Grok 检索闭环  

---

## 1. 对照交付目标的完成度

| 交付 | 目标 | 现状 | 缺口等级 |
|------|------|------|----------|
| ① 抽样表 | A–F 主样本可钉名 + 四层预标 | A/C/R1 强；**B1 空；D/E/F 空** | 🔴 高 |
| ② 真共性 | H 可跨家族证伪 | H 几乎只靠 **A+C+R1** 支撑 | 🔴 高 |
| ③ 样板 | C1 完整四层 | ✅ 可用 | 🟢 |
| ④ 上瘾/舒适/流失 | 全家族钩子 | A/R1/C 有；**D/E/F 无玩家原话** | 🟡 中 |
| ⑤ 手感 | 输入/吸附/撤销/误触 | 仅推理草案，**缺观察源** | 🟡 中 |
| 方法纪律 | 四层 + 真半假 + B≠R1 | 已立；B 真核仍未实证 | 🔴 高 |

---

## 2. 反查：已强 / 已弱 / 已偏

### 已强（可当锚点，少重复搜）

- **A：** empty tube = C2；no timer 舒适；千关同规则  
- **C1/C2/C3：** 半真出库 vs 假皮 Unblock；依赖反推  
- **R1：** 整理皮+三消骨；ads/timer 体验杀手；addicted 话术  
- **H5/H10：** 无 timer / 反广告 证据充分  

### 已弱（本三轮主攻）

| ID | 缺口内容 | 不补的后果 |
|----|----------|------------|
| **B1** | 纯货架/槽位「永久归位」无头部钉名 | 会把 R1 误当整理类 DNA |
| **D1** | packing / 行李箱几何装箱无样本 | C6、L3、真隐喻整支缺失 |
| **E1** | 形位匹配/插槽无样本 | E8/E10 手感结论漂 |
| **F1** | 清理复原机制关无样本 | 舒适对照缺对照物 |
| **手感** | 无 drag/tap 体验描述源 | ⑤ 无法升级 |
| **可解性信任** | C2「无道具过不去」未系统编码 | H7 死局归因不完整 |
| **H 跨家族** | D/E/F 未挂证据 | 「真共性」可能只是 A+C 共性 |

### 已偏（检索噪声，计划中规避）

1. Goods 关键词 → 自动漂到 triple-match（R1）  
2. packing 关键词 → 易漂到模拟经营 / 非关卡 puzzle  
3. sort 关键词 → 儿童形状玩具 / 无千关结构  
4. 商业化长评占比过高（保留为干扰因子即可，不扩搜 IAP）  

---

## 3. 修订后的三轮检索计划

### 总原则

```text
Round1  补样本钉名（B/D/E/F + 边界）
Round2  补体验话语（上瘾/舒适/流失/手感）— 只针对 Round1 钉住的名字
Round3  反查证伪 + 交叉补洞 + 改写 ①②④⑤
```

每轮：**3～4 条 Grok query** → 落 `sources/rN_*.md` → 更新缺口表 → 再进下一轮。

---

### Round 1 — 钉空洞样本（P0）

| Q# | 目标 | Query 策略 | 成功标准 |
|----|------|------------|----------|
| R1-1 | **B 真核** | `shelf organize puzzle OR tidy shelves puzzle mobile -triple -match3`；`put items correct place puzzle no match`；`room organize puzzle levels mobile` | ≥1 款完成条件≠三消的可钉名 |
| R1-2 | **D packing** | `luggage packing puzzle OR suitcase packing game mobile levels`；`pack packing puzzle jam mobile` | ≥1 款 C6 几何装箱 |
| R1-3 | **E 形位** | `shape sorting puzzle adult mobile`；`screw puzzle sort nuts bolts mobile`；`sort into holes puzzle` | ≥1 款 C5 匹配 |
| R1-4 | **F 清理** | `clean up mess puzzle mobile`；`satisfying cleanup sort game levels`；`restore order puzzle tidy` | ≥1 款 C8 状态削减 |

**排除：** 不深挖 Water/Parking/Goods 广告（已饱和）。

**若 B 仍钉不住：** 在抽样表正式标注「B 市场空洞 / 被 R1 占领」，把 B 降为「设计机会位」而非强行找幽灵竞品。

---

### Round 2 — 体验与手感（针对 R1 钉名）

| Q# | 目标 | Query 策略 | 成功标准 |
|----|------|------------|----------|
| R2-1 | 新样本玩家话 | `"[钉名]" addictive OR satisfying OR frustrating OR timer OR undo` site/community | 每钉名 ≥2 条体验主题 |
| R2-2 | 手感/操作 | `drag drop shelf puzzle mobile feel`；`parking jam tap wrong car`；`water sort pour animation satisfying` | ⑤ 表有证据行 |
| R2-3 | 可解性信任 | `impossible level without boosters sort OR jam OR bus out` | 编码「死局 vs 付费墙」 |
| R2-4 | 纯整理 vs 三消 玩家区分 | `sorting game without matching three`；`organize only no clear board` | 验证玩家是否在意 B/R1 差 |

---

### Round 3 — 证伪共性 + 交叉补洞

| Q# | 目标 | Query 策略 | 成功标准 |
|----|------|------------|----------|
| R3-1 | 反证 H2/H5 | `sorting puzzle new mechanics every level`；`timed only water sort OR goods sort love timer` | H 是否需降级 |
| R3-2 | 生活脚本权重 | `parking jam realistic OR just puzzle`；`water sort relaxing organize feeling` | 真/半/假再校准 |
| R3-3 | 千关结构 | `"1000 levels" OR "5000 levels" sort puzzle OR parking jam how difficulty increases` | 难度参数语言 |
| R3-4 | 仍空则补搜 | 根据 R1–R2 仍红项动态写 1 条 | 红项清零或标「接受空洞」 |

**Round 3 收束动作（非检索）：**

1. 更新 `01` 抽样表 v2  
2. 更新 `02` 共性（D/E/F 挂载或缩小声称范围）  
3. 更新 `04` 钩子表  
4. 更新 `05` 手感  
5. 写 `08_round_synthesis_final.md` 三轮对照表  

---

## 4. 本轮不做（明确裁剪）

- 流水 / UA / 买量素材拆解  
- 完整 IAP 设计  
- 中文市场对照（除非同核）  
- 再扩 Water Sort 攻略（已够）  

---

## 5. 执行状态

| 轮次 | 状态 | 产出 |
|------|------|------|
| Round 1 | ✅ | `sources/r1_B/D/E/F_*.md` — E Screw、F Perfect Tidy 钉住；B/D 弱 |
| Round 2 | ✅ | `sources/r2_*.md` — PT/Screw 体验、Unpacking 对照、handfeel |
| Round 3 | ✅ | `sources/r3_*.md` — ALTTL、难度、timer 证伪、packing 嵌入 |
| 合成 | ✅ | `08_round_synthesis_final.md` + 01/02/04/05/00 v2 |

### 反查后仍接受的残留缺口

| 缺口 | 处理 |
|------|------|
| 独立 D packing 头部 | 标空洞；用 PT 嵌入关代表 |
| 纯 B 千关头部 | 标机会位，不伪造竞品 |
| 实机手感 | 移交下一阶段（非检索） |
