# Changelog · 配对消牌飞出手感校准（2026-07-23）

**范围：** meet / exit 物理、点消 vs 拖消路径、跨侧拖顿感  
**钉文：** `research/handfeel/14_physical_impl_pins.md` **v1.1**  
**代码：** `src/render/phys.ts` · `src/render/cards.ts` · `src/main.ts`

---

## 1. 问题（产品）

1. 缺重量 / 力度、速度感弱、旋转少  
2. 未按抛物线飞出屏底（固定时长中途掐断）  
3. 抛物线与旋转互相干扰  
4. **跨侧拖：** 左 A1 拖到右 A2 右侧（或对称）→ 相撞/上抛段明显顿挫  

---

## 2. 根因摘要

| 现象 | 根因 |
|------|------|
| 轻飘 | `vy0/g/vx` 过小；加时长不加速度 |
| 不转 | 用 easeOut 总转角而非 ω；轴在左上角 |
| 中途消失 | 固定 `exitMs` 结束，未出屏 |
| 轨迹拧 | pivot 默认左上角，自旋 = 公转 |
| **跨侧顿** | ① 几何中点 meet 迫使目标**反向长滑** ② meet 结束后 exit **再 apply 松手 pose** 导致弹回再飞 ③ 拖消仍走 meet gather |

---

## 3. 定稿行为

### 点消
- `capturePoses` → meet（几何中点，`easeMeet`）→ exit（carry，**不**回写 pose）  
- 左右分离抛物线；牌心旋转；出屏结束；无淡出  

### 拖消
- **`skipMeet: true` 恒成立**  
- 松手瞬间 pose 直接 `exitPairShared`  
- 禁止为「聚落点」再滑目标牌  

### PHYS（摘要）
- meetMs 150 / exit 参考 280 / hard 700  
- exitVy0 −1650 · exitG 7000 · exitVx ±420 · spin 900°/s  
- 每局 jitter：vx/vy/g/spin  

---

## 4. 调研对齐（制作方法）

拖放配对成功时，行业默认：

1. **落点 / 松手画面即庆祝起点**（不要二次大位移收拢）  
2. 点选才做「汇合」峰值  
3. 离场用弧线（Arcs）+ 自旋，终点在屏外  
4. 位移与旋转必须共 pivot（牌心）  

---

## 5. 文件

| 文件 | 变更 |
|------|------|
| `research/handfeel/14_physical_impl_pins.md` | → **v1.1** |
| `research/handfeel/11_physical_anim_params.md` | 补 v0.3 节 |
| `research/handfeel/00_INDEX.md` | 链到 v1.1 / changelog |
| `src/render/phys.ts` | 参数与 easeMeet |
| `src/render/cards.ts` | poses / meet / exit |
| `src/main.ts` | 拖恒 skipMeet |
