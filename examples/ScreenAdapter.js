/**
 * 微信小游戏屏幕适配器
 *
 * 使用方法:
 *   const adapter = new ScreenAdapter(375, 667)  // 设计尺寸
 *   const gamePos = adapter.screenToGame(touchX, touchY)
 *   const safeBounds = adapter.getSafeBounds()  // 获取安全布局边界
 */
class ScreenAdapter {
  /**
   * @param {number} designWidth - 设计宽度
   * @param {number} designHeight - 设计高度
   */
  constructor(designWidth = 375, designHeight = 667) {
    this.designWidth = designWidth
    this.designHeight = designHeight

    // 获取设备信息
    const systemInfo = wx.getSystemInfoSync()
    this.screenWidth = systemInfo.windowWidth
    this.screenHeight = systemInfo.windowHeight
    this.pixelRatio = systemInfo.pixelRatio
    this.safeArea = systemInfo.safeArea || {}
    this.statusBarHeight = systemInfo.statusBarHeight || 0
    this.platform = systemInfo.platform || 'unknown'

    // 计算缩放比例（保持宽高比，适应屏幕）
    this.scale = Math.min(
      this.screenWidth / designWidth,
      this.screenHeight / designHeight
    )

    // 计算游戏区域在屏幕上的偏移（居中）
    this.offsetX = (this.screenWidth - designWidth * this.scale) / 2
    this.offsetY = (this.screenHeight - designHeight * this.scale) / 2

    // 游戏区域实际尺寸
    this.gameDisplayWidth = designWidth * this.scale
    this.gameDisplayHeight = designHeight * this.scale

    // 计算危险区域（需要避开的UI区域）
    this._calculateDangerAreas()

    console.log('ScreenAdapter initialized:', {
      screen: `${this.screenWidth}x${this.screenHeight}`,
      scale: this.scale,
      offset: `(${this.offsetX}, ${this.offsetY})`,
      safeArea: this.safeArea
    })
  }

  /**
   * 计算危险区域（右上角菜单按钮、刘海屏、底部手势条）
   */
  _calculateDangerAreas() {
    // 右上角菜单按钮区域
    // iOS: 较宽（约87px），Android: 较窄（约48px）
    const menuButtonWidth = this.platform === 'ios' ? 100 : 60
    const menuButtonHeight = this.statusBarHeight + 44

    this.dangerAreas = {
      // 顶部：状态栏 + 导航栏
      top: {
        y: 0,
        height: Math.max(this.safeArea.top || this.statusBarHeight, menuButtonHeight)
      },
      // 右上角：菜单按钮区域
      topRight: {
        x: this.screenWidth - menuButtonWidth,
        y: 0,
        width: menuButtonWidth,
        height: menuButtonHeight
      },
      // 底部：手势条区域（iPhone X系列）
      bottom: {
        y: this.safeArea.bottom || this.screenHeight,
        height: this.screenHeight - (this.safeArea.bottom || this.screenHeight)
      }
    }
  }

  /**
   * 屏幕坐标转游戏坐标
   * @param {number} screenX - 屏幕X坐标
   * @param {number} screenY - 屏幕Y坐标
   * @returns {{x: number, y: number}} 游戏坐标
   */
  screenToGame(screenX, screenY) {
    return {
      x: (screenX - this.offsetX) / this.scale,
      y: (screenY - this.offsetY) / this.scale
    }
  }

  /**
   * 游戏坐标转屏幕坐标
   * @param {number} gameX - 游戏X坐标
   * @param {number} gameY - 游戏Y坐标
   * @returns {{x: number, y: number}} 屏幕坐标
   */
  gameToScreen(gameX, gameY) {
    return {
      x: gameX * this.scale + this.offsetX,
      y: gameY * this.scale + this.offsetY
    }
  }

  /**
   * 缩放尺寸
   * @param {number} size - 游戏中的尺寸
   * @returns {number} 屏幕上的尺寸
   */
  scaleSize(size) {
    return size * this.scale
  }

  /**
   * 获取安全区域（避开刘海屏、底部手势条）
   * @returns {{top: number, bottom: number, left: number, right: number}}
   */
  getSafeArea() {
    return {
      top: this.safeArea.top || 0,
      bottom: this.safeArea.bottom || this.screenHeight,
      left: this.safeArea.left || 0,
      right: this.safeArea.right || this.screenWidth
    }
  }

  /**
   * 获取安全布局边界（考虑右上角菜单按钮）
   * @returns {{top: number, bottom: number, left: number, right: number}}
   */
  getSafeBounds() {
    return {
      top: this.dangerAreas.top.height,
      bottom: this.safeArea.bottom || this.screenHeight,
      left: this.safeArea.left || 0,
      right: this.dangerAreas.topRight.x
    }
  }

  /**
   * 转换安全区域到游戏坐标
   */
  getSafeAreaInGame() {
    const safe = this.getSafeArea()
    const topLeft = this.screenToGame(safe.left, safe.top)
    const bottomRight = this.screenToGame(safe.right, safe.bottom)
    return {
      top: topLeft.y,
      bottom: bottomRight.y,
      left: topLeft.x,
      right: bottomRight.x
    }
  }

  /**
   * 检查屏幕坐标是否在安全区域内
   * @param {number} x - 屏幕X坐标
   * @param {number} y - 屏幕Y坐标
   * @param {number} width - 元素宽度（可选）
   * @param {number} height - 元素高度（可选）
   * @returns {boolean}
   */
  isInSafeArea(x, y, width = 0, height = 0) {
    const danger = this.dangerAreas

    // 检查是否与顶部危险区域重叠
    if (y < danger.top.height) return false

    // 检查是否与右上角危险区域重叠
    if (x + width > danger.topRight.x && y < danger.topRight.height) return false

    // 检查是否与底部危险区域重叠
    if (y + height > danger.bottom.y) return false

    return true
  }

  /**
   * 调整元素位置到安全区域
   * @param {number} x - 屏幕X坐标
   * @param {number} y - 屏幕Y坐标
   * @param {number} width - 元素宽度
   * @param {number} height - 元素高度
   * @returns {{x: number, y: number}} 调整后的坐标
   */
  adjustToSafeArea(x, y, width, height) {
    const bounds = this.getSafeBounds()

    // 调整 x 坐标
    if (x < bounds.left) x = bounds.left
    if (x + width > bounds.right) x = bounds.right - width

    // 调整 y 坐标
    if (y < bounds.top) y = bounds.top
    if (y + height > bounds.bottom) y = bounds.bottom - height

    return { x, y }
  }

  /**
   * 检查游戏坐标是否在安全区域内
   */
  isInSafeAreaGame(gameX, gameY, gameWidth = 0, gameHeight = 0) {
    const screen = this.gameToScreen(gameX, gameY)
    const screenWidth = gameWidth * this.scale
    const screenHeight = gameHeight * this.scale
    return this.isInSafeArea(screen.x, screen.y, screenWidth, screenHeight)
  }

  /**
   * 获取适配后的 Canvas 尺寸建议
   */
  getCanvasSize() {
    return {
      width: this.screenWidth * this.pixelRatio,
      height: this.screenHeight * this.pixelRatio,
      styleWidth: this.screenWidth,
      styleHeight: this.screenHeight
    }
  }

  /**
   * 应用适配到 Canvas
   * @param {Canvas} canvas - wx.createCanvas() 返回的主画布
   */
  applyToCanvas(canvas) {
    const size = this.getCanvasSize()
    canvas.width = size.width
    canvas.height = size.height
    return canvas
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ScreenAdapter
}
