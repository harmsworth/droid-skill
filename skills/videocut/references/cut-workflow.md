# 剪口播详细流程

## 完整步骤

### 步骤 0: 创建输出目录

```bash
VIDEO_PATH="/path/to/视频.mp4"
VIDEO_NAME=$(basename "$VIDEO_PATH" .mp4)
DATE=$(date +%Y-%m-%d)
BASE_DIR="output/${DATE}_${VIDEO_NAME}/剪口播"
mkdir -p "$BASE_DIR/1_转录" "$BASE_DIR/2_分析" "$BASE_DIR/3_审核"
cd "$BASE_DIR"
```

### 步骤 1: 提取音频

```bash
cd 1_转录
ffmpeg -i "file:$VIDEO_PATH" -vn -acodec libmp3lame -y audio.mp3
```

### 步骤 2: 火山引擎转录（本地直传）

```bash
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
bash "$SCRIPT_DIR/scripts/transcribe.sh" audio.mp3
# 输出: volcengine_result.json
```

### 步骤 3: 生成字级字幕

```bash
node "$SCRIPT_DIR/scripts/generate_subtitles.js" volcengine_result.json
# 输出: subtitles_words.json
```

### 步骤 4: AI 口误分析

1. 生成易读格式 `readable.txt`
2. 按静音分句生成 `sentences.txt`
3. 脚本自动标记静音 → `auto_selected.json`
4. **AI 逐段分析**（分段循环，每段 300 行）追加口误 idx
5. 记录到 `口误分析.md`

**关键警告：行号 ≠ idx**

```
readable.txt 格式: idx|内容|时间
                   ↑ 用这个值

行号1500 → "1568|[静1.02s]|..."  ← idx是1568，不是1500！
```

### 步骤 5: 生成审核网页

```bash
cd ../3_审核
node "$SCRIPT_DIR/scripts/generate_review.js" ../1_转录/subtitles_words.json ../2_分析/auto_selected.json "$VIDEO_PATH"
# 输出: review.html, video.mp4(符号链接)
```

### 步骤 6: 启动审核服务器

```bash
node "$SCRIPT_DIR/scripts/review_server.js" 8899 "$VIDEO_PATH"
# 打开 http://localhost:8899
# 端口被占用时自动探测下一个可用端口
```

用户在网页中：
- 播放视频画面确认
- 勾选/取消删除项
- 点击「执行剪辑」

### 步骤 7: 执行剪辑

网页点击「执行剪辑」后，服务器自动调用：

```bash
bash "$SCRIPT_DIR/scripts/cut_video.sh" "$VIDEO_PATH" "delete_segments.json"
# 输出: *_cut.mp4
```

## 数据格式

### subtitles_words.json

```json
[
  {"text": "大", "start": 0.12, "end": 0.2, "isGap": false},
  {"text": "", "start": 6.78, "end": 7.48, "isGap": true}
]
```

### auto_selected.json

```json
[72, 85, 120]
```

## 剪辑编码规则

- 匹配原片参数重编码
- 使用 `filter_complex + trim` 帧级精确切割
- `-profile:v high -b:v {原片码率} -pix_fmt yuv420p`
