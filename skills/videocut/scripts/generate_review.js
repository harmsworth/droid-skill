#!/usr/bin/env node
/**
 * 生成审核网页（视频版本）
 *
 * 用法: node generate_review.js <subtitles_words.json> [auto_selected.json] [video_file]
 * 输出: review.html, video.mp4（符号链接到当前目录）
 */

const fs = require('fs');
const path = require('path');

const subtitlesFile = process.argv[2] || 'subtitles_words.json';
const autoSelectedFile = process.argv[3] || 'auto_selected.json';
const videoFile = process.argv[4] || 'video.mp4';

// 创建视频文件的符号链接到当前目录（避免复制大文件）
const videoBaseName = 'video.mp4';
if (videoFile !== videoBaseName && fs.existsSync(videoFile)) {
  const absVideoPath = path.resolve(videoFile);
  if (fs.existsSync(videoBaseName)) fs.unlinkSync(videoBaseName);
  try {
    fs.symlinkSync(absVideoPath, videoBaseName);
    console.log('📁 已链接视频到当前目录:', videoBaseName, '→', absVideoPath);
  } catch (err) {
    // Windows 可能需要管理员权限创建符号链接，回退到复制
    if (process.platform === 'win32') {
      console.log('⚠️ Windows 符号链接需要权限，尝试复制文件...');
      fs.copyFileSync(absVideoPath, videoBaseName);
      console.log('📁 已复制视频到当前目录:', videoBaseName);
    } else {
      throw err;
    }
  }
}

if (!fs.existsSync(subtitlesFile)) {
  console.error('❌ 找不到字幕文件:', subtitlesFile);
  process.exit(1);
}

const words = JSON.parse(fs.readFileSync(subtitlesFile, 'utf8'));

// 读取预选列表
let autoSelected = new Set();
if (fs.existsSync(autoSelectedFile)) {
  const selected = JSON.parse(fs.readFileSync(autoSelectedFile, 'utf8'));
  selected.forEach(idx => autoSelected.add(idx));
  console.log('✅ 加载预选:', autoSelected.size, '项');
}

// 按句子分组（用于显示）
const sentences = [];
let currentSentence = { words: [], start: 0 };

words.forEach((w, i) => {
  if (w.isGap && w.end - w.start >= 0.5) {
    if (currentSentence.words.length > 0) {
      sentences.push(currentSentence);
      currentSentence = { words: [], start: i + 1 };
    }
  } else if (!w.isGap) {
    if (currentSentence.words.length === 0) currentSentence.start = i;
    currentSentence.words.push({ ...w, idx: i });
  }
});
if (currentSentence.words.length > 0) sentences.push(currentSentence);

// 生成 HTML
const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>口播审核 - ${sentences.length} 句</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #1a1a1a; color: #fff; padding: 20px; }
.container { max-width: 1200px; margin: 0 auto; }
.video-area { position: sticky; top: 20px; background: #2a2a2a; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
video { width: 100%; border-radius: 8px; }
.controls { display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap; }
button { padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; }
.btn-primary { background: #4CAF50; color: white; }
.btn-danger { background: #f44336; color: white; }
.btn-info { background: #2196F3; color: white; }
.stats { display: flex; gap: 20px; margin-top: 10px; font-size: 14px; color: #aaa; }
.sentences { display: grid; gap: 8px; }
.sentence { background: #2a2a2a; border-radius: 8px; padding: 12px; cursor: pointer; transition: all 0.2s; border-left: 4px solid transparent; }
.sentence:hover { background: #3a3a3a; }
.sentence.selected { border-left-color: #f44336; background: #3a2a2a; }
.sentence .text { font-size: 16px; line-height: 1.5; }
.sentence .meta { font-size: 12px; color: #888; margin-top: 4px; }
.sentence .idx { font-size: 11px; color: #666; }
.gap { color: #666; font-style: italic; }
.selected-count { position: fixed; bottom: 20px; right: 20px; background: #f44336; color: white; padding: 12px 20px; border-radius: 8px; font-size: 16px; font-weight: bold; }
</style>
</head>
<body>
<div class="container">
<div class="video-area">
<video id="video" controls>
<source src="${videoBaseName}" type="video/mp4">
</video>
<div class="controls">
<button class="btn-primary" onclick="playSelected()">▶ 播放选中</button>
<button class="btn-danger" onclick="selectAll()">☑ 全选</button>
<button class="btn-info" onclick="deselectAll()">☐ 取消全选</button>
<button class="btn-primary" onclick="executeCut()">✂️ 执行剪辑</button>
</div>
<div class="stats">
<span>总句子: ${sentences.length}</span>
<span>已预选: ${autoSelected.size}</span>
<span id="selected-count-display">已选中: 0</span>
</div>
</div>
<div class="sentences" id="sentences">
${sentences.map((s, si) => {
  const text = s.words.map(w => w.text).join('');
  const startTime = s.words[0]?.start?.toFixed(2) || '0.00';
  const endTime = s.words[s.words.length - 1]?.end?.toFixed(2) || '0.00';
  const idxs = s.words.map(w => w.idx);
  const isSelected = idxs.some(idx => autoSelected.has(idx));
  return `<div class="sentence ${isSelected ? 'selected' : ''}" data-idxs="${idxs.join(',')}" data-start="${startTime}" onclick="toggleSentence(this)">
<div class="text">${text || '<span class="gap">[静音]</span>'}</div>
<div class="meta">
<span class="idx">#${si + 1}</span>
<span>${startTime}s - ${endTime}s</span>
<span>${s.words.length}字</span>
</div>
</div>`;
}).join('\n')}
</div>
</div>
<div class="selected-count" id="selected-count">已选中: 0</div>

<script>
let selectedIdxs = new Set();
const sentences = document.querySelectorAll('.sentence');

function toggleSentence(el) {
  const idxs = el.dataset.idxs.split(',').map(Number);
  const isSelected = el.classList.contains('selected');

  if (isSelected) {
    el.classList.remove('selected');
    idxs.forEach(idx => selectedIdxs.delete(idx));
  } else {
    el.classList.add('selected');
    idxs.forEach(idx => selectedIdxs.add(idx));
  }

  updateCount();
}

function updateCount() {
  document.getElementById('selected-count').textContent = '已选中: ' + selectedIdxs.size;
  document.getElementById('selected-count-display').textContent = '已选中: ' + selectedIdxs.size;
}

function selectAll() {
  sentences.forEach(s => {
    s.classList.add('selected');
    s.dataset.idxs.split(',').map(Number).forEach(idx => selectedIdxs.add(idx));
  });
  updateCount();
}

function deselectAll() {
  sentences.forEach(s => {
    s.classList.remove('selected');
  });
  selectedIdxs.clear();
  updateCount();
}

function playSelected() {
  const video = document.getElementById('video');
  if (selectedIdxs.size === 0) return;
  const sorted = Array.from(selectedIdxs).sort((a, b) => a - b);
  const firstIdx = sorted[0];
  // 找到包含这个 idx 的句子
  const sentence = document.querySelector('.sentence[data-idxs*="' + firstIdx + '"]');
  if (sentence) {
    video.currentTime = parseFloat(sentence.dataset.start);
    video.play();
  }
}

function executeCut() {
  if (selectedIdxs.size === 0) {
    alert('请先选择要删除的段落');
    return;
  }

  const sorted = Array.from(selectedIdxs).sort((a, b) => a - b);
  const segments = [];
  let start = null, end = null;

  // 将选中的 idx 转换为时间区间
  const words = ${JSON.stringify(words)};
  sorted.forEach(idx => {
    const word = words[idx];
    if (!word) return;
    if (start === null) {
      start = word.start;
      end = word.end;
    } else if (word.start <= end + 0.5) {
      end = word.end;
    } else {
      segments.push({ start, end });
      start = word.start;
      end = word.end;
    }
  });
  if (start !== null) segments.push({ start, end });

  if (!confirm('确定删除 ' + segments.length + ' 个片段？')) return;

  fetch('/api/cut', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(segments)
  })
  .then(r => r.json())
  .then(data => {
    if (data.success) {
      alert('✅ 剪辑完成: ' + data.output);
    } else {
      alert('❌ 失败: ' + data.error);
    }
  })
  .catch(err => alert('❌ 请求失败: ' + err.message));
}

// 初始化预选
${Array.from(autoSelected).map(idx => `selectedIdxs.add(${idx});`).join('\n')}
sentences.forEach(s => {
  const idxs = s.dataset.idxs.split(',').map(Number);
  if (idxs.some(idx => selectedIdxs.has(idx))) {
    s.classList.add('selected');
  }
});
updateCount();
</script>
</body>
</html>`;

fs.writeFileSync('review.html', html);
console.log('✅ 已生成 review.html');
console.log('📊 句子数:', sentences.length);
console.log('🎯 预选:', autoSelected.size);
