# 2026-07-23 · 纸牌 DisplayObject 对象池

## 行为

| 时机 | 动作 |
|------|------|
| 需要显示某 `alive` 牌 | `acquireView`：池取或 `createViewShell` |
| 消除飞出结束 | `releaseView` → 入池（上限 80，超出则 destroy） |
| `sync` 发现 `!alive` 且不在 anim/exit/flip | `releaseView`（trim/回收无飞出时） |
| `bootstrap` | 全部 release 再只 acquire `alive` 牌 |

## 性能

- 局中消除 **复用** Container/Sprite，少 `new`
- 死亡牌 **不占** 活动 `views` / 场景树
- 贴图仍共享 bake 缓存，池只持显示壳

## 文件

- `src/render/cards.ts`
