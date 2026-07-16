# ✈ 飞机大战

浏览器端射击小游戏，可直接在线游玩。

## 在线游玩

**[点击开始游戏 →](https://sw937.github.io/plane-battle/)**

> 首次部署需先在 GitHub 开启 Pages（只需设置一次）：
> 1. 打开 [仓库 Pages 设置](https://github.com/SW937/plane-battle/settings/pages)
> 2. **Build and deployment → Source** 选择 **GitHub Actions**
> 3. 保存后，在 [Actions](https://github.com/SW937/plane-battle/actions) 页面重新运行失败的 **Deploy to GitHub Pages** 工作流
>
> 部署成功后，访问地址为：**https://sw937.github.io/plane-battle/**

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
