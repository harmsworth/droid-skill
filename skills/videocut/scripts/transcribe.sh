#!/bin/bash
#
# 火山引擎语音识别（本地文件直传模式）
#
# 用法: ./transcribe.sh <audio_file>
# 输出: volcengine_result.json
#

AUDIO_FILE="$1"

if [ -z "$AUDIO_FILE" ]; then
  echo "❌ 用法: ./transcribe.sh <audio_file>"
  exit 1
fi

if [ ! -f "$AUDIO_FILE" ]; then
  echo "❌ 找不到音频文件: $AUDIO_FILE"
  exit 1
fi

# 获取 API Key（从 config/.env）
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$(dirname "$SCRIPT_DIR")/config/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ 找不到配置文件: $ENV_FILE"
  echo "请创建: cp $(dirname "$SCRIPT_DIR")/config/.env.example $(dirname "$SCRIPT_DIR")/config/.env"
  exit 1
fi

API_KEY=$(grep "^VOLCENGINE_API_KEY=" "$ENV_FILE" | cut -d'=' -f2 | head -1)

if [ -z "$API_KEY" ] || [ "$API_KEY" = "your_api_key_here" ]; then
  echo "❌ 火山引擎 API Key 未配置"
  echo "请编辑: $ENV_FILE"
  exit 1
fi

# 读取热词词典
DICT_FILE="$(dirname "$SCRIPT_DIR")/config/dictionary.txt"
HOT_WORDS=""
if [ -f "$DICT_FILE" ]; then
  HOT_WORDS=$(cat "$DICT_FILE" | grep -v '^$' | grep -v '^#' | while read word; do echo "\"$word\""; done | tr '\n' ',' | sed 's/,$//')
  DICT_COUNT=$(cat "$DICT_FILE" | grep -v '^$' | grep -v '^#' | wc -l | tr -d ' ')
  echo "📖 加载热词: $DICT_COUNT 个"
fi

# 构建请求参数
REQUEST_PARAMS="language=zh-CN&use_itn=True&use_capitalize=True&max_lines=1&words_per_line=15"

echo "🎤 提交火山引擎转录任务..."
echo "音频文件: $(basename "$AUDIO_FILE") ($(( $(stat -f%z "$AUDIO_FILE" 2>/dev/null || stat -c%s "$AUDIO_FILE") / 1024 / 1024 ))MB)"

# 步骤1: 提交任务（本地文件 multipart 上传）
if [ -n "$HOT_WORDS" ]; then
  SUBMIT_RESPONSE=$(curl -s -L -X POST "https://openspeech.bytedance.com/api/v1/vc/submit?$REQUEST_PARAMS" \
    -H "Accept: */*" \
    -H "x-api-key: $API_KEY" \
    -H "Connection: keep-alive" \
    -F "file=@$AUDIO_FILE" \
    -F "hot_words=[$HOT_WORDS]")
else
  SUBMIT_RESPONSE=$(curl -s -L -X POST "https://openspeech.bytedance.com/api/v1/vc/submit?$REQUEST_PARAMS" \
    -H "Accept: */*" \
    -H "x-api-key: $API_KEY" \
    -H "Connection: keep-alive" \
    -F "file=@$AUDIO_FILE")
fi

# 提取任务 ID
TASK_ID=$(echo "$SUBMIT_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$TASK_ID" ]; then
  echo "❌ 提交失败，响应:"
  echo "$SUBMIT_RESPONSE"
  exit 1
fi

echo "✅ 任务已提交，ID: $TASK_ID"
echo "⏳ 等待转录完成..."

# 步骤2: 轮询结果
MAX_ATTEMPTS=120
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  sleep 5
  ATTEMPT=$((ATTEMPT + 1))

  QUERY_RESPONSE=$(curl -s -L -X GET "https://openspeech.bytedance.com/api/v1/vc/query?id=$TASK_ID" \
    -H "Accept: */*" \
    -H "x-api-key: $API_KEY" \
    -H "Connection: keep-alive")

  STATUS=$(echo "$QUERY_RESPONSE" | grep -o '"code":[0-9]*' | head -1 | cut -d':' -f2)

  if [ "$STATUS" = "0" ]; then
    echo "$QUERY_RESPONSE" > volcengine_result.json
    echo ""
    echo "✅ 转录完成，已保存 volcengine_result.json"
    UTTERANCES=$(echo "$QUERY_RESPONSE" | grep -o '"text"' | wc -l | tr -d ' ')
    echo "📝 识别到 $UTTERANCES 段语音"
    exit 0
  elif [ "$STATUS" = "1000" ]; then
    echo -n "."
  else
    echo ""
    echo "❌ 转录失败，响应:"
    echo "$QUERY_RESPONSE"
    exit 1
  fi
done

echo ""
echo "❌ 超时，任务未完成"
exit 1
