#!/usr/bin/env node
/**
 * 字幕审核服务器
 * 直接编辑 subtitles_with_time.json，时间戳不变
 *
 * 用法: node subtitle_server.js [port] [video_path]
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const net = require('net');

const START_PORT = parseInt(process.argv[2]) || 8898;
const VIDEO_PATH = process.argv[3] || '';
const SUBTITLES_FILE = './subtitles_with_time.json';

// 获取脚本所在目录
const SCRIPT_DIR = __dirname;
const SKILL_DIR = path.join(SCRIPT_DIR, '..');

// 读取字幕数据
let subtitles = [];
if (fs.existsSync(SUBTITLES_FILE)) {
  subtitles = JSON.parse(fs.readFileSync(SUBTITLES_FILE, 'utf8'));
  console.log(`📝 加载 ${subtitles.length} 条字幕`);
} else {
  console.error('❌ 找不到 subtitles_with_time.json');
  process.exit(1);
}

// 读取词典
const DICT_FILE = path.join(SKILL_DIR, 'config', 'dictionary.txt');
let dictionary = [];
if (fs.existsSync(DICT_FILE)) {
  dictionary = fs.readFileSync(DICT_FILE, 'utf8').split('\n').filter(l => l.trim() && !l.startsWith('#'));
  console.log(`📖 加载词典 ${dictionary.length} 条`);
}

function findAvailablePort(startPort, callback) {
  const server = net.createServer();
  server.listen(startPort, () => {
    const port = server.address().port;
    server.close(() => callback(port));
  });
  server.on('error', () => findAvailablePort(startPort + 1, callback));
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // API: 获取字幕
  if (req.url === '/api/subtitles') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(subtitles));
    return;
  }

  // API: 获取词典
  if (req.url === '/api/dictionary') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(dictionary));
    return;
  }

  // API: 保存字幕
  if (req.method === 'POST' && req.url === '/api/save') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        fs.writeFileSync(SUBTITLES_FILE, JSON.stringify(data, null, 2));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // API: 烧录字幕
  if (req.method === 'POST' && req.url === '/api/burn') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        // 生成 SRT
        const srtContent = generateSRT(data);
        fs.writeFileSync('./video.srt', srtContent);

        // 查找可用字体
        let fontName = 'PingFang SC';
        try {
          const fonts = execSync('fc-list :lang=zh -f "%{family}\n" 2>/dev/null || echo ""').toString();
          if (fonts.trim()) {
            fontName = fonts.split('\n')[0].split(',')[0].trim();
          }
        } catch (e) {
          // 使用默认字体
        }

        const outputName = VIDEO_PATH ? VIDEO_PATH.replace('.mp4', '_字幕.mp4') : 'video_字幕.mp4';

        execSync(`ffmpeg -i "${VIDEO_PATH || 'video.mp4'}" -vf "subtitles='video.srt':force_style='FontSize=22,FontName=${fontName},Bold=1,PrimaryColour=&H0000deff,OutlineColour=&H00000000,Outline=2,Alignment=2,MarginV=30'" -c:a copy -y "${outputName}"`, {
          stdio: 'inherit'
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, output: outputName }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // 静态文件
  let filePath = '.' + req.url;
  if (filePath === './') filePath = './subtitle_review.html';

  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.mp4': 'video/mp4',
  };

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    res.end(content);
  });
});

function generateSRT(subtitles) {
  let srt = '';
  subtitles.forEach((sub, i) => {
    const start = formatTime(sub.start);
    const end = formatTime(sub.end);
    srt += `${i + 1}\n${start} --> ${end}\n${sub.text}\n\n`;
  });
  return srt;
}

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

findAvailablePort(START_PORT, (port) => {
  server.listen(port, () => {
    console.log(`🚀 字幕审核服务器已启动: http://localhost:${port}`);
    if (VIDEO_PATH) console.log(`📹 视频文件: ${VIDEO_PATH}`);
  });
});
