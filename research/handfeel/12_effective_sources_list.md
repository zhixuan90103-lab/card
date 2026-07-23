# 有效来源 List · 物理手感轨

**更新：** 2026-07-23 · **v4（删源后）**  
**状态：** 现行有效源目录  
**Notebook：** poker类手感调优 · `b0897377-3dc5-48c2-bc98-554cb380d352`  
**总入口：** [`docs/CURRENT.md`](../../docs/CURRENT.md) · [`docs/NOTES_PACK.md`](../../docs/NOTES_PACK.md)  
**意图轨：** [`20_intent_effective_sources_list.md`](./20_intent_effective_sources_list.md)

---

## 纪律

```text
认序：代码 > 14 钉 > CURRENT > session_bugs > 本表外源
拖消松手 → 19 + 20
NLM ≤50：NOTES_PACK 白名单；忌重复钉
```

---

## P0 · 必认（L）

| ID | 路径 | 说明 |
|----|------|------|
| **L-CUR** | `docs/CURRENT.md` | 现行一页纸 |
| **L-PACK** | `docs/NOTES_PACK.md` | 白名单 |
| **L-PF-14** | `14_physical_impl_pins.md` | **物理钉 v1.5** |
| **L-IT-19** | `19_intent_impl_pins.md` | 意图钉 |
| **L-SESS** | `changelog/...session_bugs_and_fixes.md` | 问题总表 |
| **L-CODE** | `src/render/phys.ts` · `cards.ts` | L0 |

---

## P1 · 专项（按需）

| 路径 | 说明 |
|------|------|
| `changelog/2026-07-23_drawzone_z_autodraw_dim.md` | 抽叠 / z / 自动抽 / dim |

---

## P2 · 仍保留源卡

| 路径 | 说明 |
|------|------|
| `sources/pf_*` | 物理检索史（参数以 phys 为准） |
| `sources/intent_*` | 意图轨（见 20） |

**已删除：** `fa_*` · handfeel `01–11/13` 草案 · art-ux `03/04/08`

---

## P3 · 外源（旁证）

S/A：NN/g、MDN 触控等 — **不单独定 ms**。

---

## 版本

| 版本 | 说明 |
|------|------|
| v3 | 对齐 NOTES_PACK |
| **v4** | 删源后精简 |
