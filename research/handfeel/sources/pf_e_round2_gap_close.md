# PF-E · 第二轮补漏检索（反查后 Round E）

**日期：** 2026-07-22  
**轮次：** **第二轮** = 反查 `13` 后定点补漏（**非** A/B/C 外搜二周目）  
**目标：** 关闭/收紧 PF10–13 文档钉；给 POC 可执行序  
**可信度：** 中（工程常识 + 接龙加速社区话 + 输入缓冲通识）

---

## 1. 本轮范围

| 做 | 不做 |
|----|------|
| 双牌共抛状态机写死 | 再搜生存手册全文 |
| 连消 busy / 可选跳过原则 | 泛 Game Feel |
| 洗回加速与「可调速」旁证 | 竞品逐帧库 |
| 逻辑 commit + 表现层 + S3 合流钉 | 写业务代码 |
| 升格 art-ux 的迁移检查表 | 真机定稿 |

---

## 2. PF10 · 双牌 exit 运动学（钉死）

### 2.1 默认：PairRoot 共抛

```text
P-meet 结束（两牌中心重合或距 < 8px）
  → 建临时 pairContainer（或同步驱动两 view 同一物理状态）
  → 共用: pos, vel, rot, alpha, scale
  → P-exit 单时钟 260ms
  → 结束: 两 view 回收；destroy container
```

| 项 | 值 |
|----|-----|
| 相对位 | 汇合后可保持 **微叠**（后点/目标牌 z 更高 +1） |
| 旋转 | **同 ω 同向**（默认）或 0 旋（A/B）；禁两牌反向狂转 |
| 拖消已重叠 | **skip P-meet**，直接共抛（总长 ≈ exit only ≤320） |
| 拖消未重叠 | 短 meet **≤100ms** 再共抛，总长仍 clamp ≤450 |

### 2.2 禁止

- 一牌 flyAway 旧淡出、另一牌抛物线（峰值分叉）  
- 两套独立随机 g/ω  

---

## 3. PF11 · 连消与输入

| 策略 | POC 默认 | 以后 |
|------|----------|------|
| busy 中点牌/抽/撤 | **全拒** | — |
| busy 中排队下一选 | **不做** | P1：队列长度 1 |
| 跳过剩余 exit | **不做** | P1：若新合法 meet 开始，可 fade-cut 当前 exit 后 30% |

**旁证：** 休闲游戏常见「动画中吞输入」；跳过多用于过长演出。本产品总长 ≤450，**全锁可接受**。

---

## 4. PF12 · 逻辑 vs 表现

```text
用户合法消确认
  → session 立即 applyMatch / tryMatchPair（逻辑真相）
  → 表现层 P-meet → P-exit → P-flip
  → isBusy=true 直至 exit 结束（flip 不占 busy）
  → 期间输入丢弃（除系统 cancel 清 drag）
```

抽/洗回同理：**状态先变，动画追表现**；失败仅表现层（弹回不改逻辑）。

---

## 5. PF13 · S3 合流（与抛物线同做）

```text
match 前: freeBefore = freeIdSet
match commit
cards.sync(state, skip=pair)           // 禁止随后 full refresh 无 skip
refreshHud() only
P-meet → P-exit（pair busy）
onExitDone:
  toFlip = puzzleNewlyFree(...)
  holdBack 已在 sync 时处理 或 exit 期间 toFlip 保持背
  P-flip(toFlip)  // !busy
  full refresh()
```

**与 10 一致：** 无 freeBefore / 无 skip 则 **禁止** 上线厚 P-exit。

---

## 6. 洗回加速（旁证加固）

| 源话 | 迁移 |
|------|------|
| 接龙玩家常要 **更快动画/关动画**（社区） | 多张必须加速；可预留 speed 档 |
| GSAP 等强调多对象性能 | 深位牌瞬移，只动顶 K 张 |

**维持 11：** gap 40→20；N>16 顶 8 逐张；总 cap 700/900。

---

## 7. 外搜结论

- **无** 新的可靠逐帧 ms 改写 120/260。  
- 第二轮价值在 **状态机钉** 与 **POC 检查表**，不在新理论。  
- **停止再搜 PF10–13**；剩余真机调参。

---

## 版本

| 版本 | 日期 | 变更 |
|------|------|------|
| **v1** | 2026-07-22 | Round E 补漏 |
