# 拉伸终端背景图

[English](README.md) | 中文

把终端背景图拉伸到 100%，而不是默认的封面（cover）模式。

electerm wiki 页面
[Custom CSS examples](https://github.com/electerm/electerm/wiki/Custom-CSS-examples)
里的一个 CSS 补丁，打包成插件：装上、点 **Start widget**，补丁立刻生效，之后每次启动都在。

| | |
| --- | --- |
| 形态 | instance 插件，只有一个开关 |
| 需要 | electerm **v5.8.0** 及以上 |
| 应用内容 | `style.css`，逐字复制自 wiki |
| 单元测试 | `npm test`，零依赖，无需安装 |

## 安装

**设置 → 插件 → 导入**，粘贴：

```text
electerm/electerm-widget-terminal-bg-stretch
```

也可以用**导入文件夹**指向本地克隆。

## 使用

**设置 → 插件 → Stretch Terminal Background** → **Start widget**。保留 *Apply on launch*，每次启动都会自动
重新应用；在 *Running instances* 里点 **Stop** 可以撤销。

## 它改了什么

把终端背景层的 `background-size` 改成 `100% 100%`。

`style.css` 全文：

```css
#container .session-batch-active .xterm-screen::before{background-size: 100% 100% !important;}
```

## 实现方式

这是一个纯清单 widget：只有 `package.json` 和 `style.css`，没有 JavaScript。

```json
"styles": ["style.css"]
```

electerm 读取这个列表，在 widget 运行期间把 css 应用到自己的窗口，**Stop** 时撤掉。

widget 的代码完全不在应用进程里执行，这正是重点：同一个 widget 在桌面版和
[electerm-web](https://github.com/electerm/electerm-web) 里都能用。浏览器构建没有
`webContents.insertCSS()` 可调——这也是这个 widget 上个版本（每个补丁一个约 180 行的
`main.js`，都是同一份 Electron 代码）只能在桌面版工作的原因。

- 样式表只对应一个 `<style data-electerm-widget="terminal-bg-stretch">` 标签，原地重写，重复应用不会堆叠标签。
- widget 运行期间窗口重新加载，会从宿主的注册表重建标签；开机时由自动运行列表重新应用。
- 需要在运行时改自己 css 的 widget 用 `require('@electerm/widget-api').css.apply(css)`。
  `require('electron')` 会被拒绝，widget 不会在无意中变成只能跑桌面版。

## 说明

- **独立于内置设置。** electerm 自己还有 **设置 → 通用 → 自定义 CSS**，由应用写入
  `<style id="custom-css">` 并跟随账号同步。这个插件不读也不写它。两者可以同时生效；内置设置
  的样式表在文档最后，所以同一条规则两处都写时内置设置赢。一条规则只放一处。
- **作用于整个窗口**，包括设置面板——把撤销按钮所在的面板藏起来的规则，会把自己一起藏起来。
  恢复办法：退出 electerm，删掉 `<data dir>/widgets/terminal-bg-stretch/`，自动运行项就没有东西可启动了。

## License

MIT
