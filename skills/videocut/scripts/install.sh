#!/bin/bash
#
# Videocut 环境检测与安装脚本
# 支持：macOS、Linux（Ubuntu/Debian/CentOS/Arch）、WSL2
#

set -euo pipefail

GREEN='\033[32m'
YELLOW='\033[33m'
RED='\033[31m'
BLUE='\033[34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC}  $1"; }
log_ok()   { echo -e "${GREEN}[OK]${NC}   $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC}  $1"; }
log_err()  { echo -e "${RED}[ERR]${NC}  $1"; }

detect_os() {
    case "$(uname -s)" in
        Darwin*) echo "macos" ;;
        Linux*)
            if grep -qi microsoft /proc/version 2>/dev/null; then
                echo "wsl2"
            else
                echo "linux"
            fi
            ;;
        CYGWIN*|MINGW*|MSYS*) echo "windows" ;;
        *) echo "unknown" ;;
    esac
}

check_command() {
    command -v "$1" >/dev/null 2>&1
}

echo "================================================"
echo "   Videocut 环境检测"
echo "================================================"

OS=$(detect_os)
log_info "检测到系统: $OS"

# --- 检查 Node.js ---
if check_command node; then
    NODE_VER=$(node -v)
    log_ok "Node.js 已安装: $NODE_VER"
else
    log_warn "Node.js 未安装"
    case $OS in
        macos)
            log_info "安装命令: brew install node"
            ;;
        linux|wsl2)
            log_info "安装命令: sudo apt update && sudo apt install -y nodejs npm"
            ;;
    esac
fi

# --- 检查 FFmpeg ---
if check_command ffmpeg; then
    FF_VER=$(ffmpeg -version | head -1)
    log_ok "FFmpeg 已安装: ${FF_VER:0:50}"
else
    log_warn "FFmpeg 未安装"
    case $OS in
        macos)
            log_info "安装命令: brew install ffmpeg"
            ;;
        linux|wsl2)
            log_info "安装命令: sudo apt update && sudo apt install -y ffmpeg"
            ;;
    esac
fi

# --- 检查 curl ---
if check_command curl; then
    log_ok "curl 已安装"
else
    log_warn "curl 未安装"
fi

# --- 检查火山引擎 API Key ---
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$(dirname "$SCRIPT_DIR")/config/.env"

if [ -f "$ENV_FILE" ]; then
    if grep -q "VOLCENGINE_API_KEY=" "$ENV_FILE"; then
        API_KEY=$(grep "VOLCENGINE_API_KEY=" "$ENV_FILE" | cut -d'=' -f2 | head -1)
        if [ -n "$API_KEY" ] && [ "$API_KEY" != "your_api_key_here" ]; then
            log_ok "火山引擎 API Key 已配置"
        else
            log_warn "火山引擎 API Key 未填写"
            log_info "请编辑: $ENV_FILE"
        fi
    else
        log_warn "火山引擎 API Key 未配置"
        log_info "请编辑: $ENV_FILE"
    fi
else
    log_warn "配置文件不存在: $ENV_FILE"
    log_info "请创建: cp $(dirname "$SCRIPT_DIR")/config/.env.example $(dirname "$SCRIPT_DIR")/config/.env"
fi

# --- 检查中文字体（字幕用）---
if check_command fc-list; then
    CN_FONT=$(fc-list :lang=zh -f "%{family}\n" 2>/dev/null | head -1)
    if [ -n "$CN_FONT" ]; then
        log_ok "中文字体已安装: $CN_FONT"
    else
        log_warn "未检测到中文字体（字幕烧录可能失败）"
        case $OS in
            linux|wsl2)
                log_info "安装命令: sudo apt install -y fonts-noto-cjk"
                ;;
        esac
    fi
else
    log_warn "fontconfig 未安装（无法检测字体）"
fi

echo ""
echo "================================================"

# 汇总
MISSING=0
if ! check_command node; then MISSING=$((MISSING+1)); fi
if ! check_command ffmpeg; then MISSING=$((MISSING+1)); fi
if ! check_command curl; then MISSING=$((MISSING+1)); fi

if [ "$MISSING" -eq 0 ]; then
    echo -e "${GREEN}环境检查通过，可以开始使用 videocut！${NC}"
    echo ""
    log_info "快速开始:"
    echo "  /videocut 剪口播 video.mp4"
    echo "  /videocut 字幕 video.mp4"
    echo "  /videocut 高清化 video.mp4"
else
    echo -e "${YELLOW}缺少 $MISSING 个依赖，请按上方提示安装${NC}"
fi
