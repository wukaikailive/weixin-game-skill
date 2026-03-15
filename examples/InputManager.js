/**
 * 微信小游戏触摸事件管理器
 *
 * 使用方法:
 *   const input = new InputManager()
 *   input.on('tap', (x, y) => { console.log('点击位置:', x, y) })
 */
class InputManager {
  constructor() {
    this.touches = new Map()
    this.callbacks = {
      start: [],
      move: [],
      end: [],
      tap: [],
      longPress: []
    }

    this.tapThreshold = 10      // 点击移动阈值
    this.longPressDelay = 500   // 长按延迟(ms)

    this.init()
  }

  init() {
    wx.onTouchStart(e => this.handleStart(e))
    wx.onTouchMove(e => this.handleMove(e))
    wx.onTouchEnd(e => this.handleEnd(e))
    wx.onTouchCancel(e => this.handleEnd(e))
  }

  handleStart(e) {
    e.touches.forEach(touch => {
      const data = {
        startX: touch.clientX,
        startY: touch.clientY,
        startTime: Date.now(),
        currentX: touch.clientX,
        currentY: touch.clientY
      }
      this.touches.set(touch.identifier, data)

      // 长按检测
      data.longPressTimer = setTimeout(() => {
        this.callbacks.longPress.forEach(cb => cb(touch.clientX, touch.clientY))
      }, this.longPressDelay)
    })

    this.callbacks.start.forEach(cb => cb(e.touches))
  }

  handleMove(e) {
    e.touches.forEach(touch => {
      const data = this.touches.get(touch.identifier)
      if (data) {
        data.currentX = touch.clientX
        data.currentY = touch.clientY

        // 如果移动距离超过阈值，取消长按
        const dx = data.currentX - data.startX
        const dy = data.currentY - data.startY
        if (Math.sqrt(dx * dx + dy * dy) > this.tapThreshold) {
          clearTimeout(data.longPressTimer)
        }
      }
    })

    this.callbacks.move.forEach(cb => cb(e.touches))
  }

  handleEnd(e) {
    e.changedTouches.forEach(touch => {
      const data = this.touches.get(touch.identifier)
      if (data) {
        clearTimeout(data.longPressTimer)

        // 检测是否为点击
        const dx = data.currentX - data.startX
        const dy = data.currentY - data.startY
        const distance = Math.sqrt(dx * dx + dy * dy)
        const duration = Date.now() - data.startTime

        if (distance < this.tapThreshold && duration < this.longPressDelay) {
          this.callbacks.tap.forEach(cb => cb(touch.clientX, touch.clientY))
        }

        this.touches.delete(touch.identifier)
      }
    })

    this.callbacks.end.forEach(cb => cb(e.changedTouches))
  }

  /**
   * 注册事件回调
   * @param {string} type - 事件类型: start, move, end, tap, longPress
   * @param {Function} callback - 回调函数
   */
  on(type, callback) {
    if (this.callbacks[type]) {
      this.callbacks[type].push(callback)
    }
  }

  /**
   * 移除事件回调
   */
  off(type, callback) {
    if (this.callbacks[type]) {
      const index = this.callbacks[type].indexOf(callback)
      if (index > -1) {
        this.callbacks[type].splice(index, 1)
      }
    }
  }

  /**
   * 检查是否有触摸点
   */
  isTouching() {
    return this.touches.size > 0
  }

  /**
   * 获取当前触摸点数量
   */
  getTouchCount() {
    return this.touches.size
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = InputManager
}
