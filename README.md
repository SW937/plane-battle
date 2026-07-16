# ✈ 飞机大战

浏览器端射击小游戏，可直接在线游玩。

## 在线游玩

**[点击开始游戏 →](https://sw937.github.io/plane-battle/)**

## 首次开启 Pages（解决 404，只需设置一次）

打开 **[仓库 Pages 设置](https://github.com/SW937/plane-battle/settings/pages)**，按下面配置：

1. **Build and deployment → Source** 选择 **Deploy from a branch**
2. **Branch** 选择 **gh-pages**，文件夹选 **/ (root)**
3. 点击 **Save**

保存后等待约 1 分钟，再访问：**https://sw937.github.io/plane-battle/**

> 推送代码后会自动运行 [Deploy 工作流](https://github.com/SW937/plane-battle/actions)，把游戏发布到 `gh-pages` 分支。

## 操作说明

| 操作 | 键盘 | 触屏 |
|------|------|------|
| 移动 | ← → 或 A D | 屏幕左右按钮 |
| 射击 | 空格 | 射击按钮 |
| 暂停 | P | — |

## 本地运行

```bash
./start.sh
```

或双击 `启动游戏.command`，浏览器访问 `http://127.0.0.1:8912`。

## 技术栈

纯 HTML5 Canvas + JavaScript（ES Module），无需构建工具。
