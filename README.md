# 形与词 · 移动端视觉句子生成器

无需安装依赖、无需构建工具、无需后端。

## 1. 本地启动（Windows）

- **最简单**：双击 `index.html`，用 Edge 或 Chrome 打开即可。
- **如果想用本地服务器**：在 VS Code 安装 Live Server 扩展，对 `index.html` 选择 Open with Live Server。
- **测试**：双击 `tests.html`，应显示“全部通过”。
- **模拟手机**：Edge 浏览器按 `F12`，再按 `Ctrl + Shift + M`，选择手机设备或输入 `390 × 844`。

## 2. 文件夹结构

```text
visual-sentence-project/
├─ index.html             网页结构
├─ style.css              页面样式、占位动画和响应式布局
├─ data.js                六个图形库、24 个词语、语法模板
├─ script.js              选择交互、生成算法、结果渲染
├─ tests.html             浏览器测试入口
├─ tests.js               生成算法自动测试
└─ assets/
   ├─ covers/             首页六个封面资源（当前为空）
   ├─ gifs/               第二页 24 个动图（当前为空）
   └─ qr.png              结果页内置二维码（可选，没有则显示“QR”占位）
```

## 3. 替换首页六个几何图形

将你的封面图片放进 `assets/covers/`，默认命名：

```text
library-01.svg
library-02.svg
library-03.svg
library-04.svg
library-05.svg
library-06.svg
```

如需使用 PNG、GIF 或其他名称，打开 `data.js`，修改对应图形库的 `cover` 值，例如：

```js
cover: 'assets/covers/my-own-cover.png',
```

封面资源没放进去时，网页自动使用 CSS 动态几何占位图。

## 4. 替换 24 个动态 GIF

每个库有四个词性，文件名按下表规律命名：

| 词性 | 库 01 示例文件名 |
|---|---|
| 形容词 adjective | `library-01-adjective.gif` |
| 名词 noun | `library-01-noun.gif` |
| 动词 verb | `library-01-verb.gif` |
| 副词 adverb | `library-01-adverb.gif` |

将上述 `01` 替换为 `02`～`06`，总共 24 个 GIF，全部放在 `assets/gifs/`。

建议 GIF 使用一致的 1:1 画布比例，尽量压缩体积，并预留一些透明边距以避免被裁切。项目的图片样式为 `object-fit: contain`，不会强行拉伸图片。如果某个 GIF 不存在，会自动显示对应的 CSS 占位动画。

**更换不同文件名**：打开 `data.js` 修改对应 `gif` 路径，如 `gif: 'assets/gifs/my-motion.gif'`。

## 5. 替换 GIF 对应中文词语

只编辑 `data.js` 中 `libraries` 数组的 `words`：

```js
adjective: { text: '柔软', gif: 'assets/gifs/library-01-adjective.gif', after: '的' },
noun:      { text: '云朵', gif: 'assets/gifs/library-01-noun.gif' },
verb:      { text: '旋转', gif: 'assets/gifs/library-01-verb.gif' },
adverb:    { text: '悄悄', gif: 'assets/gifs/library-01-adverb.gif', after: '地' }
```

- `text`：显示的中文词语；
- `gif`：该词语绑定的动态图；
- `after`：词语后面的助词。形容词一般填 `'的'`，副词一般填 `'地'`；有特殊情况可以改成 `''`（空字符串）或其他适合的字符。

不要改变词性键名 `adjective`、`noun`、`verb`、`adverb`，生成逻辑会依靠这些键名取词。

## 6. 修改句式与生成概率

`data.js` 里的 `templates` 决定所有可用句式：

```js
{ id: 'example', weight: 1, ending: '。', parts: [
  { pos: 'adjective' }, { pos: 'noun' },
  { literal: '，然后' }, { pos: 'verb' }
] }
```

- `{ pos: '...' }` = 一个随机抽取词语的槽位（对应一张 GIF）；
- `{ literal: '...' }` = 纯连接文字（没有 GIF）；
- `ending` = 句末标点；
- `weight` = 抽取权重（数字越大越常见，0 表示不参与）。

**重要**：若仍要支持一次选择全部六个库，至少保留一个拥有六个以上 `{ pos: ... }` 槽位的模板。

算法先筛选词槽数 ≥ 已选库数量的模板，再给每个已选库保留至少一个槽位。多出的槽位随机允许重复使用已选库。不存在“选中却不出现”的情况。

## 7. 修改视觉样式

在 `style.css` 中：

- `:root`：主色、纸张色、边框色；
- `.library-grid`、`.library-card`：第一页布局；
- `.result-grid`、`.word-unit`：第二页 2～6 个 GIF 的排列；
- `.artwork`：GIF 显示区域；
- `.word-label`、`.sentence`：文字样式；
- `.page-footer`：按钮与底部间距。

CSS 占位动画只用于正式图片文件尚未存在的情况，真实 GIF 文件被加载后会覆盖占位图。

## 8. 扫二维码访问

1. 打开 https://app.netlify.com/drop ，登录后将**包含 `index.html` 的整个项目文件夹**拖进去。
2. Netlify 会生成一个 HTTPS 地址，例如 `https://example.netlify.app`。
3. 使用二维码生成工具把这个网址转换成二维码。
4. 把生成的二维码图片保存为 `assets/qr.png`（即 `fenshen_web/assets/qr.png`），刷新网页后，结果卡片右下角的灰色“QR”占位会自动替换成真实二维码，“保存并分享”导出的图片也会使用它。
5. 如需使用其他文件名或格式（如 `my-qr.jpg`），打开 `index.html` 修改 `id="qr-image"` 的 `src`。文件不存在时网页自动退回“QR”占位，不影响其他功能。
6. 用真正的手机扫描二维码，测试图片加载、尺寸、排版及返回功能。

如果部分观众使用微信内置浏览器，或从中国大陆访问，建议提前用实际网络测试访问是否稳定。

提示：`tests.html`、`tests.js` 是可选的调试文件，部署时可以保留，也可以删除。
