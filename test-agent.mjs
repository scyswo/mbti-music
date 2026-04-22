import { readFileSync } from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';

// 讀取 .env 中的 TEST_GEMINI_API_KEY
const env = readFileSync('.env', 'utf8');
const match = env.match(/TEST_GEMINI_API_KEY=(.+)/);
if (!match) { console.error('找不到 TEST_GEMINI_API_KEY'); process.exit(1); }
const API_KEY = match[1].trim();

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

規範：
1. 10 道題目涵蓋不同日常情境（通勤、深夜、下雨、運動、失戀、咖啡館、獨處等）
2. 每道題的 5 個選項必須各對應不同的 5 種風格（順序可以打亂）
3. 所有 feature 數值精確到小數點後 2 位
4. 只回傳 JSON 陣列，不要有任何前言或後記`;

async function testAgent1() {
  console.log('=== Agent 1 測試開始 ===');
  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    console.log('呼叫 Gemini API...');
    const result = await model.generateContent(QUIZ_PROMPT);
    const raw = result.response.text().trim()
      .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

    const questions = JSON.parse(raw);
    console.log(`✅ Agent 1 成功！回傳 ${questions.length} 道題目`);
    console.log('\n第 1 題預覽：');
    console.log('  題目：', questions[0].text);
    console.log('  選項數：', questions[0].options.length);
    console.log('  第一個選項：', JSON.stringify(questions[0].options[0], null, 2));
  } catch (err) {
    console.error('❌ Agent 1 失敗：', err.message);
  }
}

testAgent1();
