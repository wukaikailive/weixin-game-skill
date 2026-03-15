/**
 * 对象池 - 用于优化频繁创建/销毁的对象
 *
 * 使用方法:
 *   const bulletPool = new ObjectPool(() => new Bullet(), 20)
 *   const bullet = bulletPool.get()
 *   bulletPool.release(bullet)
 */
class ObjectPool {
  /**
   * @param {Function} createFn - 创建对象的工厂函数
   * @param {number} initialSize - 初始池大小
   */
  constructor(createFn, initialSize = 10) {
    this.createFn = createFn
    this.pool = []
    this.active = new Set()

    // 预创建对象
    for (let i = 0; i < initialSize; i++) {
      const obj = createFn()
      obj._pooled = true
      this.pool.push(obj)
    }
  }

  /**
   * 获取一个对象
   * @returns {*} 对象实例
   */
  get() {
    let obj

    if (this.pool.length > 0) {
      obj = this.pool.pop()
    } else {
      obj = this.createFn()
      obj._pooled = true
    }

    this.active.add(obj)
    obj._active = true
    return obj
  }

  /**
   * 释放对象回池中
   * @param {*} obj - 要释放的对象
   */
  release(obj) {
    if (this.active.has(obj)) {
      this.active.delete(obj)
      obj._active = false

      // 可选：重置对象状态
      if (typeof obj.reset === 'function') {
        obj.reset()
      }

      this.pool.push(obj)
    }
  }

  /**
   * 释放所有活动对象
   */
  releaseAll() {
    this.active.forEach(obj => {
      obj._active = false
      if (typeof obj.reset === 'function') {
        obj.reset()
      }
      this.pool.push(obj)
    })
    this.active.clear()
  }

  /**
   * 获取活动对象数量
   */
  getActiveCount() {
    return this.active.size
  }

  /**
   * 获取池中可用对象数量
   */
  getAvailableCount() {
    return this.pool.length
  }

  /**
   * 遍历所有活动对象
   * @param {Function} callback - 回调函数
   */
  forEach(callback) {
    this.active.forEach(callback)
  }

  /**
   * 清空对象池
   */
  clear() {
    this.pool = []
    this.active.clear()
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ObjectPool
}
