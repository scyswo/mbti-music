import { GoogleGenerativeAI } from '@google/generative-ai';

// React only exposes REACT_APP_-prefixed env vars to the browser.
// Make sure your .env has: REACT_APP_GEMINI_API_KEY=<your key>
// 自動收集所有 REACT_APP_GEMINI_API_KEY、REACT_APP_GEMINI_API_KEY_1、_2 … 等 key
const API_KEYS = [
  process.env.REACT_APP_GEMINI_API_KEY,
  process.env.REACT_APP_GEMINI_API_KEY_1,
  process.env.REACT_APP_GEMINI_API_KEY_2,
  process.env.REACT_APP_GEMINI_API_KEY_3,
].filter(Boolean);

let keyIndex = 0;

function getClient() {
  const key = API_KEYS[keyIndex];
  if (!key) throw new Error('找不到任何 REACT_APP_GEMINI_API_KEY，請檢查 .env');
  return new GoogleGenerativeAI(key);
}

// ─── localStorage 快取（題目，TTL 30 分鐘）────────────────
const CACHE_KEY = 'gemini_quiz_v1';
const CACHE_TTL = 30 * 60 * 1000;

function getCachedQuestions() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { questions, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) { localStorage.removeItem(CACHE_KEY); return null; }
    return questions;
  } catch { return null; }
}

function setCachedQuestions(questions) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ questions, ts: Date.now() })); } catch {}
}

export function clearQuizCache() {
  try { localStorage.removeItem(CACHE_KEY); } catch {}
}

// ─── Exponential Backoff Retry + Key Rotation ─────────────
// quota 耗盡 → 切換 key（不消耗重試次數）
// 429 頻率限制 → 15s → 30s
// 503 忙碌    → 2s  → 4s  → 8s
async function withRetry(fn, maxRetries = 2) {
  const exhaustedKeys = new Set();
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      return await fn();
    } catch (err) {
      const msg = err?.message || '';
      const status = err?.status ?? err?.httpStatus ?? 0;
      const isQuota = msg.includes('PerDay') || msg.includes('quota');
      const is429   = !isQuota && (status === 429 || msg.includes('429'));
      const is503   = status === 503 || msg.includes('503') || msg.includes('high demand');

      if (isQuota) {
        exhaustedKeys.add(keyIndex);
        const next = API_KEYS.findIndex((_, i) => !exhaustedKeys.has(i));
        if (next === -1) throw new Error('所有 API Key 每日配額已耗盡，請明天再試或新增 Key');
        keyIndex = next;
        continue; // 不遞增 attempt
      }

      if (is503) throw err; // 503 直接拋出，不重試

      if (!is429 || attempt >= maxRetries) throw err;

      attempt++;
      const waitMs = (2 ** (attempt - 1)) * 15000 + Math.random() * 1000;
      await new Promise(r => setTimeout(r, waitMs));
    }
  }
}

function stripJsonFence(text) {
  return text
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
}

// ─────────────────────────────────────────────
// Agent 1：題目生成
// 輸出：10 道題目，每題 5 個選項，每個選項隱藏綁定五維特徵值
// ─────────────────────────────────────────────

const QUIZ_PROMPT = `你是一個音樂人格測驗出題專家。請生成 10 道情境式問題，用於評估受測者的音樂喜好特徵。

每道題需包含：
- "id": 題號（1-10）
- "text": 題目情境描述（繁體中文，生動有趣，50字以內）
- "options": 5 個選項陣列，每個選項包含：
  - "label": "A" | "B" | "C" | "D" | "E"
  - "text": 選項描述文字（繁體中文，30字以內）
  - "style": 風格類型，必須是以下其中之一：
      "Chill / Soft" | "Sad / Emotional" | "Romantic / Sweet" | "Dark / Moody" | "Happy / Bright"
  - "features": {
      "valence": 0.0~1.0,
      "energy": 0.0~1.0,
      "danceability": 0.0~1.0,
      "tempo": 0.0~1.0,
      "acousticness": 0.0~1.0
    }

風格對應特徵範圍（tempo 已正規化，0=慢，1=快）：
- Chill / Soft:      energy 0.1-0.4, acousticness 0.6-1.0, valence 0.4-0.6, tempo 0.2-0.4
- Sad / Emotional:   valence 0.0-0.3, energy 0.1-0.4, acousticness 0.5-0.9, tempo 0.2-0.45
- Romantic / Sweet:  valence 0.5-0.8, energy 0.2-0.5, acousticness 0.5-0.85, tempo 0.3-0.55
- Dark / Moody:      valence 0.0-0.3, energy 0.4-0.8, acousticness 0.0-0.4, tempo 0.4-0.7
- Happy / Bright:    valence 0.7-1.0, energy 0.6-1.0, danceability 0.6-1.0, tempo 0.55-0.9

規範：
1. 10 道題目涵蓋不同日常情境（通勤、深夜、下雨、運動、失戀、咖啡館、獨處等）
2. 每道題的 5 個選項必須各對應不同的 5 種風格（順序可以打亂）
3. 所有 feature 數值精確到小數點後 2 位
4. 只回傳 JSON 陣列，不要有任何前言或後記

範例（僅供格式參考，請勿直接使用）：
[
  {
    "id": 1,
    "text": "週五深夜，你獨自坐在窗邊，窗外下著細雨，這時你最想聽？",
    "options": [
      {
        "label": "A",
        "text": "輕柔的鋼琴曲，讓心安靜下來",
        "style": "Chill / Soft",
        "features": { "valence": 0.45, "energy": 0.22, "danceability": 0.28, "tempo": 0.30, "acousticness": 0.82 }
      }
    ]
  }
]`;

export async function generateQuizQuestions({ fresh = false } = {}) {
  if (!fresh) {
    const cached = getCachedQuestions();
    if (cached) return cached;
  }

  const model = getClient().getGenerativeModel({ model: 'gemini-2.5-flash' });
  return withRetry(async () => {
    const result = await model.generateContent(QUIZ_PROMPT);
    const raw = result.response.text();
    const questions = JSON.parse(stripJsonFence(raw));
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('Agent 1 回傳格式錯誤：非題目陣列');
    }
    setCachedQuestions(questions);
    return questions;
  });
}

// ─────────────────────────────────────────────
// Agent 2：人格分析核心
// 輸入：使用者五維特徵平均值（均已正規化至 0~1）
// 輸出：MBTI 類型 + 繁體中文分析
// ─────────────────────────────────────────────

function buildAnalysisPrompt(avg) {
  return `你是一位資深音樂人格分析師，擅長用溫暖有詩意的語言描繪人的內心世界。

使用者音樂喜好特徵（0~1 正規化）：
- valence（正向感 / 快樂程度）: ${avg.valence.toFixed(3)}
- energy（能量強度）:           ${avg.energy.toFixed(3)}
- danceability（舞動感）:        ${avg.danceability.toFixed(3)}
- tempo（速度感，0=慢，1=快）:  ${avg.tempo.toFixed(3)}
- acousticness（原音感）:        ${avg.acousticness.toFixed(3)}

MBTI 判斷規則（依序判斷）：
- E vs I: energy >= 0.55 → E（外向活躍），否則 → I（內斂沉浸）
- S vs N: acousticness >= 0.50 → S（偏好具體感官），否則 → N（偏好抽象直覺）
- T vs F: valence >= 0.50 → F（情感導向），否則 → T（邏輯導向）
- J vs P: tempo >= 0.50 → J（節奏規律），否則 → P（自由隨性）

請回傳以下 JSON，所有文字使用繁體中文：
{
  "mbtiType": "四字母 MBTI 類型",
  "musicPersona": "音樂人格稱號（4~8 字，有詩意，例如：深夜靈魂旅人）",
  "summary": "2~3 句對此使用者音樂靈魂的整體描述，有溫度、共鳴感強",
  "likes": "1~2 句描述喜歡的音樂風格或情境",
  "dislikes": "1~2 句描述不太偏好的音樂風格",
  "listenTime": "最偏好的聆聽時段（例如：深夜 23:00 後獨自發呆時）"
}

只回傳 JSON，不要有任何其他文字。`;
}

export async function analyzeMbtiPersonality(avgFeatures) {
  const model = getClient().getGenerativeModel({ model: 'gemini-2.5-flash' });

  return withRetry(async () => {
    const result = await model.generateContent(buildAnalysisPrompt(avgFeatures));
    const raw = result.response.text();
    const analysis = JSON.parse(stripJsonFence(raw));
    if (!analysis.mbtiType || analysis.mbtiType.length !== 4) {
      throw new Error('Agent 2 回傳 MBTI 格式錯誤');
    }
    return analysis;
  });
}
