# 字幕详细流程

## 核心流程

```
剪辑后视频 → 火山引擎转录（带热词词典）→ Agent 逐条校对 → 人工审核 → FFmpeg 烧录字幕 → 输出 _字幕.mp4
```

## Step 0: 定位视频

**优先级**（从高到低）：
1. 用户传入的视频路径
2. 当前 output 目录下的 `剪口播/3_审核/*_cut.mp4`
3. 原始视频

```bash
OUTPUT_DIR="output/YYYY-MM-DD_视频名"
CUT_VIDEO=$(find "$OUTPUT_DIR/剪口播/3_审核" -name "*_cut.mp4" -type f 2>/dev/null | head -1)

if [ -n "$CUT_VIDEO" ]; then
  VIDEO_PATH="$CUT_VIDEO"
else
  VIDEO_PATH="$ARGUMENTS"
fi
```

**关键**：字幕必须基于**剪辑后的视频**，原始视频时间戳不匹配。

## Step 1-2: 提取音频 + 转录

同剪口播流程，转录脚本会自动加载 `config/dictionary.txt` 作为热词。

## Step 3: Agent 校对

**核心原则：只改不加**

### 常见误识别规则表

| 误识别 | 正确 | 类型 |
|--------|------|------|
| 成风 | 成峰 | 同音字 |
| 正特/整特 | Agent | 误识别 |
| IT就 | Agent就 | 发音相似 |
| cloud code | Claude Code | 发音相似 |
| Schill/skill | skills | 发音相似 |
| 剪口拨/剪口波 | 剪口播 | 同音字 |
| 自净化/资金化 | 自进化 | 同音字 |
| 减口播 | 剪口播 | 同音字 |
| 录剪 | 漏剪 | 同音字 |

### 常见漏字问题

| 原文 | 修正 | 说明 |
|------|------|------|
| 步呢是配置 | 第二步呢是配置 | 漏"第二" |
| 4步就是 | 第4步就是 | 漏"第" |
| 别省时间 | 特别省时间 | 漏"特" |

### 原稿校对规则

- **原稿没有 = 必须删除**
- **绝不能从原稿往字幕里"补"内容**
- **校对方向是单向的**
- **产品名以原稿为准**

## Step 4: 启动字幕审核服务器

```bash
node "$SCRIPT_DIR/scripts/subtitle_server.js" 8898 "$VIDEO_PATH"
# 端口被占用时自动探测
# 访问 http://localhost:8898
```

功能：
- 左侧视频播放，右侧字幕列表
- 播放时自动高亮当前字幕
- 双击字幕文字编辑（时间戳不变）
- 倍速播放（1x/1.5x/2x/3x）
- 保存字幕 / 导出 SRT / 烧录字幕

## Step 5: 烧录字幕

脚本自动检测可用字体，默认样式：
- 22号金黄粗体、黑色描边2px、底部居中

```bash
ffmpeg -i "video.mp4" \
  -vf "subtitles='video.srt':force_style='FontSize=22,FontName={font},Bold=1,PrimaryColour=&H0000deff,OutlineColour=&H00000000,Outline=2,Alignment=2,MarginV=30'" \
  -c:a copy -y "video_字幕.mp4"
```

## 字幕规范

| 规则 | 说明 |
|------|------|
| 一屏一行 | 不换行，不堆叠 |
| 句尾无标点 | `你好` 不是 `你好。` |
| 句中保留标点 | `先点这里，再点那里` |
