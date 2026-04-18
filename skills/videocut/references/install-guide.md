# 安装指南

## 依赖清单

| 依赖 | 用途 | macOS | Linux/WSL2 | Windows |
|------|------|-------|-----------|---------|
| Node.js 18+ | 运行脚本 | `brew install node` | `sudo apt install nodejs npm` | [官网下载](https://nodejs.org) |
| FFmpeg | 视频处理 | `brew install ffmpeg` | `sudo apt install ffmpeg` | [官网下载](https://ffmpeg.org) |
| curl | API 调用 | 预装 | 预装 | 预装 |
| 中文字体 | 字幕烧录 | PingFang SC（预装） | `sudo apt install fonts-noto-cjk` | 手动安装 |

## 快速安装

### macOS

```bash
brew install node ffmpeg
```

### Ubuntu / Debian / WSL2

```bash
sudo apt update
sudo apt install -y nodejs npm ffmpeg fonts-noto-cjk
```

### CentOS / RHEL / Fedora

```bash
sudo yum install -y nodejs ffmpeg
# 或
sudo dnf install -y nodejs ffmpeg
```

### Arch Linux

```bash
sudo pacman -S nodejs npm ffmpeg noto-fonts-cjk
```

## 配置火山引擎 API Key

1. 注册火山引擎账号: https://console.volcengine.com
2. 开通「语音识别」服务
3. 获取 API Key
4. 配置到 videocut:

```bash
cp ~/.agents/skills/videocut/config/.env.example ~/.agents/skills/videocut/config/.env
# 编辑 .env，填入 VOLCENGINE_API_KEY
```

## 验证安装

```bash
bash ~/.agents/skills/videocut/scripts/install.sh
```

输出应显示所有依赖已安装、API Key 已配置。
