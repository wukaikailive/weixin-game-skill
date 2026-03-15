/**
 * 微信小游戏屏幕适配器
 *
 * 使用方法:
 *   const adapter = new ScreenAdapter(375, 667)  // 设计尺寸
 *   const gamePos = adapter.screenToGame(touchX, touchY)
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

    console.log('ScreenAdapter initialized:', {
      screen: `${this.screenWidth}x${this.screenHeight}`,
      scale: this.scale,
      offset: `(${this.offsetX}, ${this.offsetY})`
    })
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
   * 检查点是否在安全区域内
   */
  isInSafeArea(x, y) {
    const safe = this.getSafeArea()
    return x >= safe.left && x <= safe.right && y >= safe.top && y <= safe.bottom
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
