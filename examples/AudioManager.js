/**
 * 微信小游戏音频管理器
 *
 * 使用方法:
 *   const audio = new AudioManager()
 *   audio.loadSound('click', 'audio/click.mp3')
 *   audio.playSound('click')
 *   audio.playMusic('audio/bgm.mp3')
 */
class AudioManager {
  constructor() {
    this.sounds = new Map()
    this.music = null
    this.muted = false
    this.musicVolume = 1.0
    this.soundVolume = 1.0
    this.currentMusicSrc = null
  }

  /**
   * 预加载音效
   * @param {string} name - 音效名称
   * @param {string} src - 音效路径
   */
  loadSound(name, src) {
    const audio = wx.createInnerAudioContext()
    audio.src = src
    this.sounds.set(name, { audio, src })
    return audio
  }

  /**
   * 批量预加载音效
   * @param {Object} list - 音效列表 { name: src }
   */
  loadSounds(list) {
    Object.entries(list).forEach(([name, src]) => {
      this.loadSound(name, src)
    })
  }

  /**
   * 播放音效
   * @param {string} name - 音效名称
   * @param {number} volume - 音量 0-1
   */
  playSound(name, volume) {
    if (this.muted) return

    const sound = this.sounds.get(name)
    if (!sound) {
      console.warn(`音效 "${name}" 未加载`)
      return
    }

    const audio = sound.audio
    audio.volume = volume !== undefined ? volume : this.soundVolume
    audio.stop()
    audio.play()
  }

  /**
   * 播放背景音乐
   * @param {string} src - 音乐路径
   * @param {boolean} loop - 是否循环
   */
  playMusic(src, loop = true) {
    if (this.currentMusicSrc === src && this.music) {
      return // 已经在播放
    }

    this.stopMusic()

    this.music = wx.createInnerAudioContext()
    this.music.src = src
    this.music.loop = loop
    this.music.volume = this.musicVolume

    if (!this.muted) {
      this.music.play()
    }

    this.currentMusicSrc = src
  }

  /**
   * 暂停背景音乐
   */
  pauseMusic() {
    if (this.music) {
      this.music.pause()
    }
  }

  /**
   * 恢复背景音乐
   */
  resumeMusic() {
    if (this.music && !this.muted) {
      this.music.play()
    }
  }

  /**
   * 停止背景音乐
   */
  stopMusic() {
    if (this.music) {
      this.music.stop()
      this.music.destroy()
      this.music = null
      this.currentMusicSrc = null
    }
  }

  /**
   * 设置音乐音量
   * @param {number} volume - 音量 0-1
   */
  setMusicVolume(volume) {
    this.musicVolume = volume
    if (this.music) {
      this.music.volume = volume
    }
  }

  /**
   * 设置音效音量
   * @param {number} volume - 音量 0-1
   */
  setSoundVolume(volume) {
    this.soundVolume = volume
  }

  /**
   * 静音/取消静音
   */
  setMuted(muted) {
    this.muted = muted
    if (muted) {
      this.pauseMusic()
    } else {
      this.resumeMusic()
    }
  }

  /**
   * 切换静音状态
   */
  toggleMute() {
    this.setMuted(!this.muted)
    return this.muted
  }

  /**
   * 销毁所有音频资源
   */
  destroy() {
    this.sounds.forEach(({ audio }) => audio.destroy())
    this.sounds.clear()
    this.stopMusic()
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AudioManager
}
