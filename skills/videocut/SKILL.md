---
name: videocut
description: 口播视频智能剪辑 Agent。自动识别口误/重复/静音/卡顿，生成审核页面，一键 FFmpeg 剪辑导出。触发词：剪口播、视频剪辑、口播、加字幕、高清化、视频导出
license: MIT
metadata:
  author: https://github.com/Ceeon
  version: "2.0.0"
  domain: video-editing
  triggers: 剪口播,视频剪辑,口播,字幕,高清化,视频导出
  role: specialist
  scope: implementation
  output-format: code
---

# Videocut — 口播视频智能剪辑

基于 FFmpeg + 火山引擎 ASR + Claude 语义理解的口播视频剪辑管线。

解决剪映两大痛点：
1. **无法理解语义**：重复说的句子、说错后纠正的内容，模式匹配识别不了
2. **字幕质量差**：专业术语（Claude Code、MCP、API）经常识别错误

## 快速开始

```bash
# 1. 安装环境（首次使用）
bash ~/.agents/skills/videocut/scripts/install.sh

# 2. 配置火山引擎 API Key
cp ~/.agents/skills/videocut/config/.env.example ~/.agents/skills/videocut/config/.env
# 编辑 ~/.agents/skills/videocut/config/.env，填入 VOLCENGINE_API_KEY

# 3. 剪口播
/videocut 剪口播 video.mp4

# 4. 加字幕（剪辑完成后）
/videocut 字幕 video.mp4

# 5. 高清导出（可选）
/videocut 高清化 video.mp4
```

## 核心工作流

### 1. 剪口播

```
输入视频 → 提取音频 → 火山引擎转录（字级时间戳）→ AI 口误分析 → 生成审核页 → 人工确认 → FFmpeg 剪辑 → 输出 _cut.mp4
```

执行步骤：
1. **创建输出目录** — `output/YYYY-MM-DD_视频名/剪口播/`
2. **提取音频** — `ffmpeg -i video.mp4 -vn audio.mp3`
3. **火山引擎转录** — 本地音频直传，无需第三方托管
4. **生成字级字幕** — `subtitles_words.json`
5. **AI 口误分析** — 静音/重复句/句内重复/卡顿词/重说纠正
6. **生成审核网页** — `review.html`，浏览器打开逐条确认
7. **执行剪辑** — FFmpeg filter_complex 帧级精确切割

**检测规则（按优先级）**：

| 类型 | 判断方法 | 删除范围 |
|------|----------|----------|
| 重复句 | 相邻句子开头≥5字相同 | 较短的**整句** |
| 隔一句重复 | 中间是残句时，比对前后句 | 前句+残句 |
| 残句 | 话说一半+静音 | **整个残句** |
| 句内重复 | A+中间+A 模式 | 前面部分 |
| 卡顿词 | 那个那个、就是就是 | 前面部分 |
| 重说纠正 | 部分重复/否定纠正 | 前面部分 |
| 语气词 | 嗯、啊、那个 | 标记但不自动删 |
| 静音 | >0.3s 空白 | 自动预选 |

**核心原则**：先分句再比对，整句删除，范围整段删除（含中间 gap）。

### 2. 加字幕

```
剪辑后视频 → 火山引擎转录（带热词词典）→ Agent 逐条校对 → 人工审核 → FFmpeg 烧录字幕 → 输出 _字幕.mp4
```

字幕样式：22号金黄粗体、黑色描边2px、底部居中。

**校对原则（只改不加）**：
- 人名必查（词典热词不保证100%识别）
- 碎片合并（"音画"+"同步"→"音画同步"）
- 句尾无标点，句中保留标点

### 3. 高清化

```
输入视频 → 检测原片参数 → Pass 1 分析复杂度 → Pass 2 编码 + 锐化 → 输出 _hd.mp4
```

默认 1.2x 原片码率，2-pass，轻微锐化补偿量化噪声。

## 约束规则

### MUST DO
- 字幕必须基于**剪辑后的视频**（`*_cut.mp4`），不能用原始视频
- 校对只能修正识别错误，绝不能往字幕里添加视频中没有的话
- 原稿里没有的内容 = 已剪掉，必须删除（不能从原稿"补"进字幕）
- 分析口误时先分句再比对（sentences.txt）
- 标记口误时从 startIdx 到 endIdx **整段删除**（含中间 gap）
- `readable.txt` 行号 ≠ idx，用 idx 列的值
- 使用 `review_server.js` 而非 `python3 -m http.server`（需支持 HTTP Range）

### MUST NOT DO
- 不要逐个挑选文字 idx 而跳过 gap
- 不要从原稿往字幕里"补"内容
- 不要自作主张决定保留或删除（标记留给人工审核）
- 不要用脚本自动匹配原稿校对（文字差异导致时间戳累积错误）

## 参考文档

| 主题 | 文档 | 何时加载 |
|------|------|----------|
| 安装指南 | `references/install-guide.md` | 首次使用、环境报错 |
| 剪口播流程 | `references/cut-workflow.md` | 剪口播时 |
| 字幕流程 | `references/subtitle-workflow.md` | 加字幕时 |
| 高清导出 | `references/hd-export.md` | 高清化时 |
| 口误分析 Prompt | `prompts/analyze_mistakes.md` | AI 分析口误时 |
| 用户习惯规则 | `references/user-habits.md` | 需要调整规则时 |

## 故障排查

### 火山引擎转录失败
- 检查 `config/.env` 中 `VOLCENGINE_API_KEY` 是否配置
- 检查音频文件是否生成成功（`audio.mp3`）
- 检查网络是否能访问 `openspeech.bytedance.com`

### 审核网页打不开
- 检查端口是否被占用：脚本会自动探测可用端口
- 检查视频文件路径是否正确（支持符号链接）
- 必须使用 `review_server.js`，不能替换为 python 简易服务器

### 剪辑后音画不同步
- 脚本已使用 `filter_complex + trim` 而非 `concat demuxer`
- 检查原片是否有可变帧率（VFR），如有需先统一为 CFR

### 字幕字体找不到
- Linux/WSL2: `sudo apt install fonts-noto-cjk`
- macOS: 使用 PingFang SC（已预装）
- 脚本会自动探测可用字体
