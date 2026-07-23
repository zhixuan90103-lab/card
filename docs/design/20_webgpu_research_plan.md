# 20 · WebGPU 主路径检索计划（保效果迁移）

**状态：** ✅ **检索结案** · 正式 **D29** · 剩余 **R4 真机跟踪**（非选型）  
**日期：** 2026-07-23  
**版本：** **v0.6**（第三轮实测 + 自主拍板）  
**权威级：** L5 归档；决策认 **L2 `04` D29** + **L0 代码**  

| 关联 | 路径 |
|------|------|
| **R3 结论** | [`20_webgpu_r3_findings.md`](./20_webgpu_r3_findings.md) |
| 反查 | [`21_webgpu_gap_audit.md`](./21_webgpu_gap_audit.md) v2 |
| R1 | [`20_webgpu_r1_findings.md`](./20_webgpu_r1_findings.md) |
| 决策 | [`04`](./04_decisions_log.md) **D28·D29** · [`10`](./10_tech_decision.md) · [`19`](./19_ios_renderer_lifecycle.md) |
| 截图 | `docs/art_mockups/webgpu_r3_poc/` |
| 有效源 | [`research/tech-stack/21_webgpu_effective_sources_list.md`](../../research/tech-stack/21_webgpu_effective_sources_list.md) |

---

## 0. 结案一句话

> **默认优先 WebGPU，失败回退 WebGL**（`['webgpu','webgl']`）；**禁 canvas**；**D28** 对 WebGL/WebGPU lost 一视同仁。  
> **iOS 部署维持 15** → WebGPU 为渐进增强。  
> 桌面 R3 实测：回退可靠；WebGPU 可启时 `backend=webgpu`；静态 P0 **无 🔴**。  
> **检索停止。** Capacitor 真机 = 实现跟踪。

---

## 1. 已关闭

- [x] R1 文献  
- [x] 反查 v1/v2  
- [x] R3 代码 + 包体 + Playwright 回退/WebGPU  
- [x] 静态 P0 代理验收  
- [x] **D29 / P-iOS** 写入 L2  
- [x] 外搜停 · 有效源 List  

## 2. 跟踪（非检索）

- [ ] R4 Capacitor：`backend` + 一局 + 后台  
- [ ] 可选：动效自动点测 / device.lost 注入  

---

## 3. 现行 L0 钉（结案）

```text
rendererPreference 默认 → ['webgpu','webgl']
?renderer=webgl|webgpu|auto · localStorage.card_renderer
device.lost + webglcontextlost → rehydrate
deployment iOS = 15.0
```

---

## 4. 轮次总表

| 轮 | 内容 | 状态 |
|----|------|------|
| R1 | 文献源卡 | ✅ |
| R2 | 反查 v1→v2 | ✅ |
| **R3** | **实测 + D29 拍板** | ✅ |
| R4 | Capacitor | 跟踪 |

---

## 5. 修订

| 版本 | 变更 |
|------|------|
| v0.1–v0.5 | 计划/反查/R3 代码 |
| **v0.6** | **第三轮实测结案检索；D29；P0 代理表；包体；停选型** |
