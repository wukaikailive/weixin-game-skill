---
name: weixin-game
description: 微信小游戏开发技术限制与最佳实践指南，帮助 Claude Code 在开发微信小游戏时遵循正确的 API 和技术规范。
version: 1.0.0
author: community
tags:
  - weixin
  - minigame
  - wechat
  - game-development
  - canvas
---

# 微信小游戏开发技术限制与最佳实践

指导 Claude Code 在开发微信小游戏时遵循技术限制和实现规范。

## 触发条件

TRIGGER when:
- 用户提到"微信小游戏"、"小游戏开发"、"微信游戏"
- 代码中使用 `wx.` API（如 `wx.createCanvas`、`wx.onTouchStart` 等）
- 项目包含 `game.json` 或 `project.config.json`（微信小游戏配置文件）
- 用户询问关于 Canvas 游戏在微信环境的适配

DO NOT trigger when:
- 开发普通 Web 应用或 H5 页面
- 使用其他小程序框架（如 uni-app、taro 开发普通小程序）
- 纯浏览器环境游戏开发

---

## 核心技术限制

### 1. 运行环境差异

微信小游戏运行在 JavaScriptCore/V8 引擎中，**不是浏览器环境**：

| 特性 | 浏览器 | 微信小游戏 |
|------|--------|-----------|
| 全局对象 | `window` | `globalThis` |
| DOM | `document.*` | **不支持** |
| Canvas 创建 | `document.createElement('canvas')` | `wx.createCanvas()` |
| 图片加载 | `new Image()` | `wx.createImage()` |
| 存储 | `localStorage` | `wx.setStorageSync()` |
| 音频 | `new Audio()` | `wx.createInnerAudioContext()` |
| 网络 | `fetch()` / `XMLHttpRequest` | `wx.request()` |

### 2. 包大小限制

```
主包限制: 4MB
分包总限制: 20MB
单分包限制: 2MB（建议不超过 1.5MB）
```

**应对策略**：
- 使用分包加载（`subpackages` 配置）
- 资源远程加载（CDN）
- 图片压缩、音频压缩
- 代码混淆和压缩

### 3. Canvas API 限制

```javascript
// ❌ 不支持的 API
ctx.roundRect()           // 需手动实现圆角矩形
ctx.toDataURL()           // 部分限制
ctx.getImageData()        // 性能敏感

// ✅ 手动实现圆角矩形
function drawRoundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}
```

### 4. 颜色格式限制

```javascript
// ❌ 部分格式不支持或不稳定
ctx.fillStyle = '#00d4ff40'        // 带透明度的简写 hex
ctx.fillStyle = 'hsl(200, 100%, 50%)'  // HSL 格式

// ✅ 推荐使用 rgba
ctx.fillStyle = 'rgba(0, 212, 255, 0.25)'
ctx.fillStyle = '#00d4ff'          // 标准 hex
```

### 5. 网络请求限制

```javascript
// 必须配置合法域名（小程序后台配置）
// 仅支持 HTTPS
// 请求超时默认 60 秒

// ❌ 不支持
fetch('https://api.example.com/data')

// ✅ 使用 wx.request
wx.request({
  url: 'https://api.example.com/data',
  method: 'GET',
  success(res) {
    console.log(res.data)
  },
  fail(err) {
    console.error(err)
  }
})

// WebSocket 限制
wx.connectSocket({
  url: 'wss://socket.example.com'  // 必须是 wss
})
```

---

## API 适配指南

### 全局变量

```javascript
// ❌ 浏览器写法
window.gameState = {}
window.myGlobal = value

// ✅ 微信小游戏写法
// 方案1: 使用 globalThis
globalThis.gameState = {}

// 方案2: 文件顶层定义
let gameState = {}  // 模块级变量

// 方案3: 创建全局管理器
// GameGlobal.js
export const GameGlobal = {
  state: {},
  config: {}
}
```

### Canvas 管理

```javascript
// 主 Canvas（屏幕 Canvas）
const mainCanvas = wx.createCanvas()
const ctx = mainCanvas.getContext('2d')

// 离屏 Canvas（用于缓存、预渲染）
const offCanvas = wx.createOffscreenCanvas({
  type: '2d',
  width: 512,
  height: 512
})

// 获取实际显示尺寸
const { windowWidth, windowHeight } = wx.getSystemInfoSync()
mainCanvas.width = windowWidth
mainCanvas.height = windowHeight
```

### 图片加载

```javascript
// ✅ 微信小游戏图片加载
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = wx.createImage()
    img.onload = () => resolve(img)
    img.onerror = (err) => reject(err)
    img.src = src  // 相对路径或配置的 CDN 域名
  })
}

// 加载多张图片
async function loadAssets() {
  const assets = {
    player: await loadImage('images/player.png'),
    enemy: await loadImage('images/enemy.png'),
    bg: await loadImage('images/background.png')
  }
  return assets
}
```

### 触摸事件

```javascript
// 微信使用全局触摸事件，不是 Canvas 上的事件
class TouchManager {
  constructor() {
    this.touches = new Map()
    this.callbacks = {
      start: [],
      move: [],
      end: []
    }
    this.init()
  }

  init() {
    wx.onTouchStart(e => this.handleTouch('start', e))
    wx.onTouchMove(e => this.handleTouch('move', e))
    wx.onTouchEnd(e => this.handleTouch('end', e))
    wx.onTouchCancel(e => this.handleTouch('end', e))
  }

  handleTouch(type, e) {
    e.touches.forEach(touch => {
      this.callbacks[type].forEach(cb => cb(touch))
    })
  }

  on(type, callback) {
    this.callbacks[type].push(callback)
  }
}

// 使用
const touchManager = new TouchManager()
touchManager.on('start', (touch) => {
  console.log('Touch at:', touch.clientX, touch.clientY)
})
```

### 音频播放

```javascript
// 音频管理器
class AudioManager {
  constructor() {
    this.sounds = new Map()
    this.music = null
    this.muted = false
  }

  // 加载音效
  loadSound(name, src) {
    const audio = wx.createInnerAudioContext()
    audio.src = src
    this.sounds.set(name, audio)
    return audio
  }

  // 播放音效
  playSound(name, volume = 1.0) {
    if (this.muted) return
    const audio = this.sounds.get(name)
    if (audio) {
      audio.volume = volume
      audio.stop()
      audio.play()
    }
  }

  // 播放背景音乐
  playMusic(src, loop = true) {
    if (this.music) {
      this.music.stop()
      this.music.destroy()
    }
    this.music = wx.createInnerAudioContext()
    this.music.src = src
    this.music.loop = loop
    this.music.play()
  }

  // 销毁所有音频
  destroy() {
    this.sounds.forEach(audio => audio.destroy())
    this.sounds.clear()
    if (this.music) {
      this.music.destroy()
      this.music = null
    }
  }
}
```

### 本地存储

```javascript
// ✅ 微信存储 API
// 同步存储
wx.setStorageSync('playerData', { level: 5, score: 1000 })
const data = wx.getStorageSync('playerData') || {}

// 异步存储（推荐用于大数据）
wx.setStorage({
  key: 'largeData',
  data: largeObject,
  success() { console.log('Saved') },
  fail(err) { console.error(err) }
})

// 删除
wx.removeStorageSync('key')
wx.clearStorageSync()  // 清空所有
```

---

## 屏幕适配方案

```javascript
class ScreenAdapter {
  constructor(designWidth = 375, designHeight = 667) {
    this.designWidth = designWidth
    this.designHeight = designHeight

    const info = wx.getSystemInfoSync()
    this.screenWidth = info.windowWidth
    this.screenHeight = info.windowHeight
    this.pixelRatio = info.pixelRatio
    this.safeArea = info.safeArea

    // 计算缩放（保持宽高比）
    this.scale = Math.min(
      this.screenWidth / designWidth,
      this.screenHeight / designHeight
    )

    // 计算偏移（居中）
    this.offsetX = (this.screenWidth - designWidth * this.scale) / 2
    this.offsetY = (this.screenHeight - designHeight * this.scale) / 2
  }

  // 屏幕坐标 -> 游戏坐标
  screenToGame(x, y) {
    return {
      x: (x - this.offsetX) / this.scale,
      y: (y - this.offsetY) / this.scale
    }
  }

  // 游戏坐标 -> 屏幕坐标
  gameToScreen(x, y) {
    return {
      x: x * this.scale + this.offsetX,
      y: y * this.scale + this.offsetY
    }
  }

  // 获取安全区域（避开刘海屏、底部手势条）
  getSafeArea() {
    return {
      top: this.safeArea.top,
      bottom: this.safeArea.bottom,
      left: this.safeArea.left,
      right: this.safeArea.right
    }
  }
}
```

---

## 性能优化建议

### 1. 渲染优化

```javascript
// ❌ 每帧都清除整个画布
ctx.clearRect(0, 0, canvas.width, canvas.height)

// ✅ 只清除变化区域（对于静态背景）
ctx.clearRect(obj.x - 1, obj.y - 1, obj.width + 2, obj.height + 2)

// ✅ 使用离屏 Canvas 缓存静态元素
const cacheCanvas = wx.createOffscreenCanvas({ width: 200, height: 200 })
const cacheCtx = cacheCanvas.getContext('2d')
// 绘制一次
cacheCtx.drawImage(backgroundImg, 0, 0)

// 主循环中直接绘制缓存
ctx.drawImage(cacheCanvas, 0, 0)
```

### 2. 对象池

```javascript
class ObjectPool {
  constructor(createFn, initialSize = 10) {
    this.createFn = createFn
    this.pool = []
    this.active = []

    // 预创建对象
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(createFn())
    }
  }

  get() {
    const obj = this.pool.pop() || this.createFn()
    this.active.push(obj)
    return obj
  }

  release(obj) {
    const index = this.active.indexOf(obj)
    if (index > -1) {
      this.active.splice(index, 1)
      this.pool.push(obj)
    }
  }

  releaseAll() {
    while (this.active.length) {
      this.pool.push(this.active.pop())
    }
  }
}

// 使用示例：子弹池
const bulletPool = new ObjectPool(() => ({ x: 0, y: 0, active: false }), 20)
```

### 3. 资源管理

```javascript
// 资源预加载
class AssetLoader {
  constructor() {
    this.images = new Map()
    this.audios = new Map()
  }

  async loadImages(list) {
    const promises = list.map(item =>
      loadImage(item.src).then(img => {
        this.images.set(item.name, img)
        return { name: item.name, img }
      })
    )
    return Promise.all(promises)
  }

  getImage(name) {
    return this.images.get(name)
  }
}

// 使用
const loader = new AssetLoader()
await loader.loadImages([
  { name: 'player', src: 'images/player.png' },
  { name: 'enemy', src: 'images/enemy.png' }
])
```

---

## 常见错误与解决

### 错误 1: `window is not defined`

```javascript
// ❌ 使用 window
window.myVar = value

// ✅ 使用 globalThis 或模块变量
globalThis.myVar = value
```

### 错误 2: `document is not defined`

```javascript
// ❌ 使用 document
const el = document.getElementById('xxx')
document.createElement('canvas')

// ✅ 使用微信 API
const canvas = wx.createCanvas()
```

### 错误 3: 图片加载失败

```javascript
// 检查路径是否正确
// 检查是否配置了 download 域名（网络图片）
// 检查图片格式（支持 png, jpg, gif）

wx.createImage()
img.onerror = (e) => {
  console.error('Image load failed:', e)
}
```

### 错误 4: 音频无法播放

```javascript
// 用户交互后才能播放音频
// 首次播放需要在 touchstart/touchend 回调中触发

let audioInitialized = false
wx.onTouchStart(() => {
  if (!audioInitialized) {
    // 初始化音频
    audioInitialized = true
  }
})
```

---

## 项目结构建议

```
my-minigame/
├── game.json              # 游戏配置
├── game.js                # 入口文件
├── project.config.json    # 项目配置
├── js/
│   ├── Game.js           # 游戏主类
│   ├── scenes/           # 场景
│   │   ├── MenuScene.js
│   │   └── GameScene.js
│   ├── entities/         # 实体类
│   │   ├── Player.js
│   │   └── Enemy.js
│   ├── managers/         # 管理器
│   │   ├── AudioManager.js
│   │   ├── InputManager.js
│   │   └── SceneManager.js
│   └── utils/            # 工具类
│       ├── ObjectPool.js
│       └── ScreenAdapter.js
├── images/               # 图片资源
├── audio/                # 音频资源
└── subpackages/          # 分包
    ├── level2/
    └── level3/
```

---

## game.json 配置示例

```json
{
  "deviceOrientation": "portrait",
  "showStatusBar": false,
  "networkTimeout": {
    "request": 10000,
    "connectSocket": 10000,
    "uploadFile": 10000,
    "downloadFile": 10000
  },
  "subpackages": [
    {
      "name": "level2",
      "root": "subpackages/level2"
    },
    {
      "name": "level3",
      "root": "subpackages/level3"
    }
  ],
  "plugins": {}
}
```

---

## 检查清单

开发微信小游戏时，Claude Code 应确保：

- [ ] 不使用 `window`、`document`、`DOM` API
- [ ] 使用 `wx.createCanvas()` 创建 Canvas
- [ ] 使用 `wx.createImage()` 加载图片
- [ ] 使用 `wx.createInnerAudioContext()` 播放音频
- [ ] 使用 `wx.onTouchStart/Move/End` 处理触摸
- [ ] 使用 `wx.setStorageSync/getStorageSync` 存储
- [ ] 使用 `wx.request()` 进行网络请求
- [ ] 手动实现 `roundRect()` 等不支持的 API
- [ ] 颜色使用 `rgba()` 或标准 `#RRGGBB` 格式
- [ ] 实现屏幕适配和像素比适配
- [ ] 音频资源在用户交互后才能播放
- [ ] 处理安全区域（刘海屏、底部手势条）
- [ ] 实现对象池优化性能
- [ ] 使用分包加载控制包大小
