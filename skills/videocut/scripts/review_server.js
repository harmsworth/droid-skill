#!/usr/bin/env node
/**
 * 审核服务器
 *
 * 功能：
 * 1. 提供静态文件服务（review.html, video.mp4）
 * 2. POST /api/cut - 接收删除列表，执行剪辑
 *
 * 用法: node review_server.js [port] [video_file]
 * 默认: port=自动探测, video_file=自动检测目录下的 .mp4
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const net = require('net');

let VIDEO_FILE = process.argv[3] || findVideoFile();
const START_PORT = parseInt(process.argv[2]) || 8899;

function findVideoFile() {
  const files = fs.readdirSync('.').filter(f => f.endsWith('.mp4'));
  return files[0] || 'source.mp4';
}

function findAvailablePort(startPort, callback) {
  const server = net.createServer();
  server.listen(startPort, () => {
    const port = server.address().port;
    server.close(() => callback(port));
  });
  server.on('error', () => findAvailablePort(startPort + 1, callback));
}

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
};

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // API: 执行剪辑
  if (req.method === 'POST' && req.url === '/api/cut') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const segments = JSON.parse(body);
        fs.writeFileSync('delete_segments.json', JSON.stringify(segments, null, 2));

        // 获取脚本目录
        const SCRIPT_DIR = __dirname;
        const CUT_SCRIPT = path.join(SCRIPT_DIR, 'cut_video.sh');

        const outputName = VIDEO_FILE.replace('.mp4', '_cut.mp4');
        execSync(`bash "${CUT_SCRIPT}" "${VIDEO_FILE}" "delete_segments.json" "${outputName}"`, {
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
  if (filePath === './') filePath = './review.html';

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
});

findAvailablePort(START_PORT, (port) => {
  server.listen(port, () => {
    console.log(`🚀 审核服务器已启动: http://localhost:${port}`);
    console.log(`📹 视频文件: ${VIDEO_FILE}`);
  });
});
