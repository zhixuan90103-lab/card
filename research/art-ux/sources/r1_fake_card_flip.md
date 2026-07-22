# 参数卡 · 2D 伪翻面（scale.x）

- 品类：纸牌 / 通用 2D 卡牌
- 输入：翻开展示（非拖放）
- 可信度：**高**（多引擎共识：HTML5 / Defold / Godot 教程同一套路）
- 源：
  - [HTML5 gamedevs · Fake flip](https://www.html5gamedevs.com/topic/5419-3d-rotation-of-sprites-card-flip-animation/)
  - [Defold forum · scale swap at 50%](https://forum.defold.com/t/easy-card-flip-effect-with-animation-in-y-axis/74343)

| 项 | 观察值 | 备注 |
|----|--------|------|
| 技法 | **scale.x → 0 → 换面 → scale.x → 1** | 中点换纹理/绘制 |
| 真 3D | 非必须 | 透视可选；本产品 tech 已否真 3D |
| 时长（行业实践） | 常见 **150–300ms** 整段 | 文档少钉死 ms；对齐 NN 取中短 |
| 选中 | 不与翻面混用 | 选中用抬升/描边 |
| 消牌 | 可另轨迹 | 翻面服务「露出」，消牌服务「兑现」 |
| free 可读 | 翻完必须亮面+字 | 对齐 I5 |
| 非法 | — | — |
| HUD | — | — |
| 过关 | — | — |

**可迁移：**  
- 非 free → free：`scale.x` 伪翻 **总时长 160ms**（推荐）或 120–200  
- ease：前半 ease-in、后半 ease-out 或整体 ease-out  
- **不**做透视扭曲（包体/实现成本）  

**不可迁移：**  
- 全桌每帧 3D 旋转相机  
- 揭开整层过场长演出  

**对本产品：** E06 默认 **160ms**；仅 newly-free 牌播一次；busy 可不锁或极短锁。
