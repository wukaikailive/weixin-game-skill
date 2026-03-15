# 微信小游戏开发 Skill

一个 Claude Code Skill，用于指导 AI 在开发微信小游戏时遵循技术限制和最佳实践。

## 功能特点

- 🎯 **自动触发**：检测到微信小游戏开发场景时自动激活
- 📋 **技术限制清单**：完整的 API 差异对照表
- 💡 **代码示例**：包含常用功能的适配代码
- ⚡ **性能优化**：对象池、离屏渲染等优化方案
- 📱 **屏幕适配**：多分辨率适配解决方案

## 安装方法

### 方法一：项目级安装（推荐）

将 skill 文件复制到你的微信小游戏项目的 `.claude/skills/` 目录：

```bash
# 进入你的微信小游戏项目
cd your-minigame-project

# 创建 skills 目录
mkdir -p .claude/skills

# 下载 skill 文件
curl -o .claude/skills/weixin-game.md https://raw.githubusercontent.com/your-username/weixin-game-skill/main/skill.md
```

或者手动创建文件：

```bash
# 创建目录
mkdir -p .claude/skills

# 将 skill.md 内容复制到 .claude/skills/weixin-game.md
```

### 方法二：全局安装

将 skill 安装到用户目录，所有项目都可以使用：

```bash
# macOS/Linux
mkdir -p ~/.claude/skills
curl -o ~/.claude/skills/weixin-game.md https://raw.githubusercontent.com/your-username/weixin-game-skill/main/skill.md

# Windows (PowerShell)
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.claude\skills"
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/your-username/weixin-game-skill/main/skill.md" -OutFile "$env:USERPROFILE\.claude\skills\weixin-game.md"
```

### 方法三：克隆完整仓库

```bash
# 克隆仓库
git clone https://github.com/your-username/weixin-game-skill.git

# 复制 skill 到项目
cp weixin-game-skill/skill.md your-project/.claude/skills/weixin-game.md

# 复制示例代码（可选）
cp -r weixin-game-skill/examples your-project/
```

## 使用方法

安装后，Claude Code 会在以下场景自动激活此 skill：

1. 提到"微信小游戏"、"小游戏开发"等关键词
2. 代码中使用 `wx.createCanvas()`、`wx.onTouchStart()` 等 API
3. 项目包含 `game.json` 或 `project.config.json` 配置文件

### 示例对话

```
你: 帮我创建一个微信小游戏的触摸事件管理器
Claude: [自动应用 skill，使用 wx.onTouchStart 等 API]
```

```
你: 这个 canvas 代码在微信小游戏中报错
Claude: [检测到微信环境，提示 document.createElement 不支持，建议使用 wx.createCanvas()]
```

## 项目结构

```
weixin-game-skill/
├── README.md                    # 说明文档
├── skill.md                     # Skill 定义文件（安装此文件）
├── weixin.MD                    # 技术参考文档
├── LICENSE                      # MIT 许可证
└── examples/                    # 示例代码
    ├── game.json               # 游戏配置示例
    ├── InputManager.js         # 触摸事件管理器
    ├── AudioManager.js         # 音频管理器
    ├── ScreenAdapter.js        # 屏幕适配器
    └── ObjectPool.js           # 对象池实现
```

## 在项目中使用示例代码

```bash
# 复制需要的示例文件到你的项目
cp examples/InputManager.js your-project/js/managers/
cp examples/AudioManager.js your-project/js/managers/
cp examples/ScreenAdapter.js your-project/js/utils/
cp examples/ObjectPool.js your-project/js/utils/
```

## 技术限制覆盖

| 类别 | 限制内容 |
|------|---------|
| 运行环境 | 无 `window`/`document`/DOM API |
| 包大小 | 主包 4MB，分包总 20MB |
| Canvas | `roundRect()` 不支持，需手动实现 |
| 网络 | 仅 HTTPS，需配置合法域名 |
| 音频 | 需用户交互后才能播放 |
| WebGL | 仅支持 WebGL1 |
| 触摸 | 全局事件，非 Canvas 事件 |

## API 适配速查

| 浏览器 API | 微信小游戏 API |
|-----------|---------------|
| `window` | `globalThis` |
| `document.createElement('canvas')` | `wx.createCanvas()` |
| `new Image()` | `wx.createImage()` |
| `localStorage` | `wx.setStorageSync()` |
| `new Audio()` | `wx.createInnerAudioContext()` |
| `fetch()` | `wx.request()` |
| `addEventListener('touchstart')` | `wx.onTouchStart()` |

## 贡献

欢迎提交 Issue 和 Pull Request 来完善这个 skill！

### 开发指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 相关资源

- [微信小游戏官方文档](https://developers.weixin.qq.com/minigame/dev/guide/)
- [微信小游戏 API 文档](https://developers.weixin.qq.com/minigame/dev/api/)
- [Claude Code 文档](https://docs.anthropic.com/claude-code)
