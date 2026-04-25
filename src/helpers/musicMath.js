// ─────────────────────────────────────────────────────────────
// musicMath.js — 音樂特徵數學工具
// 提供：Tempo 正規化、Cosine Similarity、特徵平均值計算、
//       風格偏好權重統計、Top-N 推薦、Spotify CSV 解析
// ─────────────────────────────────────────────────────────────

const FEATURE_KEYS = ['valence', 'energy', 'danceability', 'tempo', 'acousticness'];

const TEMPO_MIN = 60;
const TEMPO_MAX = 200;

// 所有可能的風格（順序固定，供權重計算使用）
export const ALL_STYLES = [
  'Chill / Soft',
  'Sad / Emotional',
  'Romantic / Sweet',
  'Dark / Moody',
  'Happy / Bright',
];

// 中英文對照標籤
export const STYLE_LABEL = {
  'Chill / Soft':     { zh: '放鬆柔和', en: 'Chill / Soft' },
  'Sad / Emotional':  { zh: '感傷情緒', en: 'Sad / Emotional' },
  'Romantic / Sweet': { zh: '浪漫甜蜜', en: 'Romantic / Sweet' },
  'Dark / Moody':     { zh: '黑暗憂鬱', en: 'Dark / Moody' },
  'Happy / Bright':   { zh: '歡快明亮', en: 'Happy / Bright' },
};

// ─── 數值工具 ─────────────────────────────────────────────

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

export function normalizeTempo(bpm) {
  return clamp01((Number(bpm) - TEMPO_MIN) / (TEMPO_MAX - TEMPO_MIN));
}

export function normalizeFeatures(song) {
  return {
    valence:      clamp01(Number(song.valence)      || 0),
    energy:       clamp01(Number(song.energy)       || 0),
    danceability: clamp01(Number(song.danceability) || 0),
    tempo:        normalizeTempo(Number(song.tempo) || 120),
    acousticness: clamp01(Number(song.acousticness) || 0),
  };
}

// ─── Cosine Similarity ────────────────────────────────────

export function cosineSimilarity(vecA, vecB) {
  let dot = 0, magA = 0, magB = 0;
  for (const k of FEATURE_KEYS) {
    const a = Number(vecA[k]) || 0;
    const b = Number(vecB[k]) || 0;
    dot  += a * b;
    magA += a * a;
    magB += b * b;
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

// ─── 特徵平均值 ───────────────────────────────────────────
// answers: { features, style }[] — 只取 features 部分

export function calculateAverageFeatures(answers) {
  if (!answers || answers.length === 0) {
    return { valence: 0.5, energy: 0.5, danceability: 0.5, tempo: 0.5, acousticness: 0.5 };
  }
  const sum = Object.fromEntries(FEATURE_KEYS.map(k => [k, 0]));
  for (const { features } of answers) {
    for (const k of FEATURE_KEYS) {
      sum[k] += Number(features[k]) || 0;
    }
  }
  const n = answers.length;
  return Object.fromEntries(FEATURE_KEYS.map(k => [k, sum[k] / n]));
}

// ─── 風格偏好權重 ─────────────────────────────────────────
// answers: { features, style }[]
// 回傳：{ 'Chill / Soft': 40, 'Sad / Emotional': 10, ... }（百分比）
// 並附帶 sorted（由高到低）方便渲染

export function calculateStyleWeights(answers) {
  const counts = Object.fromEntries(ALL_STYLES.map(s => [s, 0]));
  for (const { style } of answers) {
    if (style && counts[style] !== undefined) counts[style]++;
  }
  const total = answers.length || 1;
  const weights = Object.fromEntries(
    ALL_STYLES.map(s => [s, Math.round((counts[s] / total) * 100)])
  );
  // sorted array for rendering (high → low)
  weights._sorted = [...ALL_STYLES].sort((a, b) => weights[b] - weights[a]);
  return weights;
}

// ─── Top-N 推薦 ───────────────────────────────────────────

export function getTopSimilarSongs(userVector, songs, n = 3) {
  if (!songs || songs.length === 0) return [];
  const ranked = songs
    .filter(s => s && FEATURE_KEYS.some(k => s[k] !== undefined && s[k] !== null))
    .map(song => ({
      ...song,
      similarity: cosineSimilarity(userVector, normalizeFeatures(song)),
    }))
    .sort((a, b) => b.similarity - a.similarity);

  // 從相似度最高的前 10 首隨機抽 n 首，保留相關性又有多樣性
  const pool = ranked.slice(0, Math.max(n, 10));
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n);
}

// ─── Spotify CSV 解析器（瀏覽器端）───────────────────────
// 支援欄位名稱：PascalCase（Spotify 官方匯出）或 snake_case（自定義）
// 使用方式：將 CSV 放在 public/spotify_tracks.csv，由 fetchLocalCSV() 取用

function splitCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function resolveField(row, ...candidates) {
  for (const key of candidates) {
    const val = row[key.toLowerCase()];
    if (val !== undefined && val !== '') return val;
  }
  return '';
}

export function parseSpotifyCSV(csvText) {
  // Strip UTF-8 BOM (\uFEFF) that Spotify CSV exports include
  const lines = csvText.replace(/^\uFEFF/, '').trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = splitCSVLine(lines[0]).map(h => h.toLowerCase());

  return lines
    .slice(1)
    .filter(l => l.trim())
    .map(line => {
      const values = splitCSVLine(line);
      const row = {};
      headers.forEach((h, i) => { row[h] = values[i] || ''; });

      return {
        spotify_id:   resolveField(row, 'spotify uri', 'spotify_id', 'uri', 'track uri'),
        name:         resolveField(row, 'track name', 'name', 'title', 'song name'),
        artist:       resolveField(row, 'artist name(s)', 'artist', 'artists', 'artist name'),
        danceability: parseFloat(resolveField(row, 'danceability')) || 0,
        energy:       parseFloat(resolveField(row, 'energy')) || 0,
        valence:      parseFloat(resolveField(row, 'valence')) || 0,
        tempo:        parseFloat(resolveField(row, 'tempo')) || 0,
        acousticness: parseFloat(resolveField(row, 'acousticness')) || 0,
      };
    })
    .filter(s => s.name || s.spotify_id); // 過濾空行
}

export async function fetchLocalCSV(path = '/spotify_tracks.csv') {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`CSV 讀取失敗（${res.status}）：${path}`);
  const text = await res.text();
  return parseSpotifyCSV(text);
}

export async function fetchMultipleCSVs(paths = []) {
  const results = await Promise.allSettled(paths.map(p => fetchLocalCSV(p)));
  return results
    .filter(r => r.status === 'fulfilled' && r.value.length > 0)
    .flatMap(r => r.value);
}

