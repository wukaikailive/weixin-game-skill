# 微信小游戏开发技术问题总结

## 1. 全局对象差异

**问题**：微信小游戏没有 `window` 对象
```javascript
// 浏览器环境
window.myGlobal = {}

// 微信小游戏环境
// 方案1: 使用 globalThis
globalThis.myGlobal = {}

// 方案2: 在文件顶层直接定义变量
let myGlobal = {}
```

## 2. Canvas API 限制

**问题**：部分 Canvas 方法不支持或有差异

```javascript
// roundRect() 方法不支持，需手动实现
drawRoundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

// 某些渐变颜色格式不支持，避免使用带透明度的简写
// ❌ ctx.fillStyle = '#00d4ff40'  // 某些情况下不生效
// ✅ ctx.fillStyle = 'rgba(0, 212, 255, 0.25)'
```

## 3. 没有 DOM 操作

**问题**：无法使用 `document`、`Element` 等 DOM API

```javascript
// 浏览器环境
const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d')

// 微信小游戏 - 使用 wx.createCanvas()
const canvas = wx.createCanvas()
const ctx = canvas.getContext('2d')

// 创建离屏 canvas
const offCanvas = wx.createOffscreenCanvas({ width: 100, height: 100 })
```

## 4. 触摸事件处理差异

**问题**：触摸事件 API 不同，需要适配层

```javascript
// 浏览器环境
canvas.addEventListener('touchstart', (e) => {
  const touch = e.touches[0]
  const x = touch.clientX
  const y = touch.clientY
})

// 微信小游戏 - 全局触摸事件
wx.onTouchStart((e) => {
  const touch = e.touches[0]
  const x = touch.clientX
  const y = touch.clientY
})

// 建议：封装统一输入管理器
class InputManager {
  constructor(canvas) {
    this.touches = new Map()
    this.setupEvents()
  }

  setupEvents() {
    wx.onTouchStart(e => this.onTouchStart(e))
    wx.onTouchMove(e => this.onTouchMove(e))
    wx.onTouchEnd(e => this.onTouchEnd(e))
    wx.onTouchCancel(e => this.onTouchEnd(e))
  }
}
```

## 5. 本地存储 API 差异

**问题**：没有 `localStorage`，使用微信专用 API

```javascript
// 浏览器环境
localStorage.setItem('key', JSON.stringify(data))
JSON.parse(localStorage.getItem('key'))

// 微信小游戏
wx.setStorageSync('key', data)  // 自动序列化
wx.getStorageSync('key')        // 自动反序列化
```

## 6. 音频播放差异

**问题**：没有 `Audio` 对象，需使用 `InnerAudioContext`

```javascript
// 浏览器环境
const audio = new Audio('sound.mp3')
audio.play()

// 微信小游戏
const audio = wx.createInnerAudioContext()
audio.src = 'audio/sound.mp3'
audio.play()

// 注意：需要手动销毁
audio.destroy()
```

## 7. 屏幕适配问题

**问题**：不同设备分辨率差异大，需要适配

```javascript
class Game {
  constructor() {
    this.designWidth = 375   // 设计宽度
    this.designHeight = 667  // 设计高度

    // 获取设备屏幕尺寸
    const systemInfo = wx.getSystemInfoSync()
    this.screenWidth = systemInfo.windowWidth
    this.screenHeight = systemInfo.windowHeight

    // 计算缩放比例（保持宽高比）
    this.scale = Math.min(
      this.screenWidth / this.designWidth,
      this.screenHeight / this.designHeight
    )
  }

  // 屏幕坐标转游戏坐标
  screenToWorld(x, y) {
    return {
      x: (x - (this.screenWidth - this.designWidth * this.scale) / 2) / this.scale,
      y: (y - (this.screenHeight - this.designHeight * this.scale) / 2) / this.scale
    }
  }
}
```

## 8. 振动反馈

```javascript
// 微信小游戏振动 API
wx.vibrateShort({ type: 'heavy' })  // 短振动
wx.vibrateLong()                     // 长振动

// 需要检查权限和设置
const settings = wx.getStorageSync('settings')
if (settings.vibration) {
  wx.vibrateShort({ type: 'heavy' })
}
```

## 9. 调试方式

**问题**：无法使用浏览器 DevTools

```javascript
// 使用 console.log（在开发者工具可见）
console.log('debug info', data)

// 使用 vConsole（真机调试）
// 在 game.json 中配置
{
  "deviceOrientation": "portrait",
  "showStatusBar": false,
  "networkTimeout": {
    "request": 10000
  }
}

// 开发者工具提供模拟器，但真机行为可能不同
// 建议定期真机测试
```

## 10. 文件路径问题

**问题**：资源路径需要使用相对于项目根目录

```javascript
// ❌ 错误：使用网络路径或绝对路径
const img = wx.createImage()
img.src = 'https://example.com/image.png'  // 需要配置域名

// ✅ 正确：使用本地相对路径
img.src = 'images/background.png'
```

## 11. 模块系统注意事项

```javascript
// 微信小游戏支持 ES6 模块
// 但需要注意循环依赖问题

// ✅ 推荐：清晰的模块结构
// js/
//   ├── entities/      # 实体类
//   ├── managers/      # 管理器
//   ├── scenes/        # 场景
//   ├── utils/         # 工具类
//   └── Game.js        # 主入口
```

## 12. 包大小限制

```
主包限制: 4MB
分包总限制: 20MB
单分包限制: 2MB（建议不超过 1.5MB）
```

**分包加载配置**（game.json）:
```json
{
  "subpackages": [
    {
      "name": "level2",
      "root": "subpackages/level2/"
    }
  ]
}
```

**加载分包**:
```javascript
const loadTask = wx.loadSubpackage({
  name: 'level2',
  success() {
    console.log('分包加载成功')
  },
  fail(err) {
    console.error('分包加载失败', err)
  }
})
```

## 13. WebGL 支持

微信小游戏支持 WebGL，但有限制：
```javascript
const canvas = wx.createCanvas()
const gl = canvas.getContext('webgl')

// 注意事项：
// 1. 不支持 WebGL2
// 2. 纹理大小建议不超过 2048x2048
// 3. 注意内存管理，及时释放资源
```

## 14. 开放数据域

排行榜等开放数据需要在独立目录：
```
├── game.js          # 主域
├── open-data-context/  # 开放数据域
│   └── index.js
```

```javascript
// 主域创建开放数据域 Canvas
const openDataContext = wx.getOpenDataContext()
openDataContext.postMessage({
  type: 'updateScore',
  score: 100
})

// 开放数据域接收消息
wx.onMessage(data => {
  if (data.type === 'updateScore') {
    // 更新排行榜
  }
})
```

## 15. 多线程 Worker

```javascript
// 主线程
const worker = wx.createWorker('workers/game.js')

worker.postMessage({
  msg: 'hello worker'
})

worker.onMessage(res => {
  console.log('收到 worker 消息', res)
})

// workers/game.js
worker.onMessage(res => {
  worker.postMessage({
    msg: '处理完成'
  })
})
```

## 16. 分享功能

```javascript
// 主动分享
wx.shareAppMessage({
  title: '快来挑战我！',
  imageUrl: 'images/share.png',
  query: 'level=5&score=1000'
})

// 右上角菜单分享
wx.onShareAppMessage(() => {
  return {
    title: '玩游戏，赢大奖！',
    imageUrl: 'images/share.png'
  }
})
```

## 17. 用户信息获取

```javascript
// 新版 API（需要用户授权）
wx.getUserProfile({
  desc: '用于显示用户昵称和头像',
  success(res) {
    console.log(res.userInfo)
  }
})

// 或使用开放数据域获取好友排行等信息
```

## 18. 性能监控

```javascript
// 获取性能数据
const performance = wx.getPerformance()
const data = performance.getEntriesByType('navigation')
console.log('页面加载时间', data)

// 内存警告
wx.onMemoryWarning((res) => {
  console.log('内存警告', res.level)
  // 清理缓存、释放资源
})
```

## 总结清单

| 功能 | 浏览器 | 微信小游戏 |
|------|--------|-----------|
| 全局对象 | `window` | `globalThis` / 顶层变量 |
| Canvas 创建 | `document.createElement()` | `wx.createCanvas()` |
| 触摸事件 | `addEventListener` | `wx.onTouchStart/Move/End` |
| 存储 | `localStorage` | `wx.setStorageSync` |
| 音频 | `new Audio()` | `wx.createInnerAudioContext()` |
| 振动 | `navigator.vibrate()` | `wx.vibrateShort/Long()` |
| 网络 | `fetch/XMLHttpRequest` | `wx.request()` |
| 圆角矩形 | `ctx.roundRect()` | 手动实现 |
| WebGL | WebGL1/WebGL2 | 仅 WebGL1 |
| 分包 | 不需要 | 必须配置（超4MB时） |
| Worker | Web Worker | wx.createWorker() |
| 分享 | 无 | wx.shareAppMessage() |
