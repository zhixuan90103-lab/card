# 反馈事件表 · 检索祖先（镜像说明）

**日期：** 2026-07-22  
**状态：** Round B′ **已合流** → **产品唯一源 = `research/art-ux/03_ue_event_table.md` v1.2**  
**本文件：** 保留检索历史索引；**勿再当实现真理**。冲突以 art-ux/03 为准。

---

## 请改读

| 用途 | 文档 |
|------|------|
| **UE 事件（唯一源）** | [`../art-ux/03_ue_event_table.md`](../art-ux/03_ue_event_table.md) **v1.2** |
| **动画参数** | [`../art-ux/04_animation_params.md`](../art-ux/04_animation_params.md) **v0.2** |
| **实现钉 / busy** | [`../art-ux/08_impl_pins_r31.md`](../art-ux/08_impl_pins_r31.md) |
| **验收清单** | [`05_feel_spec.md`](./05_feel_spec.md) |
| **反查** | [`04_gap_audit_v1.md`](./04_gap_audit_v1.md) |
| **源卡** | [`sources/`](./sources/) |

---

## B′ 合流内容摘要（已写入 art-ux/03）

- E03 → **E03a / E03b**（点消 / 拖消同 flyAway）  
- **E04b** 弹回（不配 / 空地）  
- **E-drag** / **E-drag-cancel**  
- busy = flyAway ∪ snapBack ∪ 拖中；flip 不锁  
- 剂量 L0–L5；成功双路径同峰值  

---

## 历史

| 版本 | 说明 |
|------|------|
| v0.1 | Round A/B 草案（含拖放） |
| v0.2 本页 | 降为镜像；权威迁 art-ux/03 v1.2 |
