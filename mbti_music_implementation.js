/**
 * MBTI 音樂推薦系統 - 完整實現
 * 功能：
 * 1. 使用 Gemini API 進行智能 AI Agent 意圖判斷
 * 2. 自動補充 CSV 數據（語言、風格、MBTI）
 */

const fs = require('fs');
const csv = require('csv-parser');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const LanguageDetect = require('languagedetect');

// ============ 配置 ============
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'YOUR_API_KEY_HERE';
const SPOTIFY_ACCESS_TOKEN = process.env.SPOTIFY_ACCESS_TOKEN || '';
const LASTFM_API_KEY = process.env.LASTFM_API_KEY || '';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const detector = new LanguageDetect();

// ============ MBTI 特徵映射表 ============
const MBTI_FEATURE_MAPPING = {
  'ENFP': {
    description: '外向、直覺、感受、知覺 - 充滿活力、爱冒险',
    energyMin: 0.6,
    danceabilityMin: 0.55,
    valenceMin: 0.55,
    tempoMin: 100
  },
  'INFP': {
    description: '內向、直覺、感受、知覺 - 深思熟慮、理想主義',
    energyMax: 0.5,
    acousticnessMin: 0.4,
    valenceMin: 0.35,
    tempoMax: 130
  },
  'ENFJ': {
    description: '外向、直覺、感受、判斷 - 魅力領導者',
    energyMin: 0.55,
    danceabilityMin: 0.5,
    valenceMin: 0.5
  },
  'INFJ': {
    description: '內向、直覺、感受、判斷 - 神秘先知',
    energyMax: 0.55,
    acousticnessMin: 0.5,
    valenceMin: 0.3
  },
  'ESTJ': {
    description: '外向、感受、思考、判斷 - 邏輯執行者',
    energyMin: 0.7,
    danceabilityMin: 0.6,
    tempoMin: 120
  },
  'ISTJ': {
    description: '內向、感受、思考、判斷 - 責任邏輯者',
    energyMax: 0.65,
    acousticnessMin: 0.45,
    tempoMax: 140
  },
  'ESFP': {
    description: '外向、感受、感受、知覺 - 表演娛樂者',
    energyMin: 0.75,
    danceabilityMin: 0.7,
    valenceMin: 0.6
  },
  'ISFP': {
    description: '內向、感受、感受、知覺 - 藝術探險家',
    energyMax: 0.55,
    acousticnessMin: 0.6,
    valenceMin: 0.4
  },
  'ESTP': {
    description: '外向、感受、思考、知覺 - 創業實踐者',
    energyMin: 0.8,
    danceabilityMin: 0.65,
    tempoMin: 125
  },
  'ISTP': {
    description: '內向、感受、思考、知覺 - 邏輯工匠',
    energyMax: 0.65,
    acousticnessMin: 0.4,
    tempoMin: 90
  },
  'ESFJ': {
    description: '外向、感受、感受、判斷 - 親切守護者',
    energyMin: 0.6,
    valenceMin: 0.55,
    acousticnessMin: 0.3
  },
  'ISFJ': {
    description: '內向、感受、感受、判斷 - 溫暖照顧者',
    energyMax: 0.6,
    acousticnessMin: 0.55,
    valenceMin: 0.35
  },
  'ENTJ': {
    description: '外向、直覺、思考、判斷 - 戰略指揮官',
    energyMin: 0.7,
    tempoMin: 120,
    danceabilityMin: 0.55
  },
  'INTJ': {
    description: '內向、直覺、思考、判斷 - 獨立戰略家',
    energyMax: 0.6,
    acousticnessMin: 0.5,
    tempoMax: 130
  },
  'ENTP': {
    description: '外向、直覺、思考、知覺 - 聰慧辯論者',
    energyMin: 0.65,
    danceabilityMin: 0.5,
    tempoMin: 110
  },
  'INTP': {
    description: '內向、直覺、思考、知覺 - 邏輯思考者',
    energyMax: 0.55,
    acousticnessMin: 0.4,
    valenceMax: 0.5
  }
};

// ============ 第一部分：使用 Gemini API 的 AI Agent ============

/**
 * 用 Gemini 分析用戶查詢意圖
 * @param {string} userInput - 用戶輸入
 * @returns {Promise<Object>} 結構化決策
 */
async function analyzeUserQueryWithGemini(userInput) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const systemPrompt = `
你是一個專業的音樂推薦 AI Agent。分析用戶的輸入，理解他們的真實需求。

可識別的意圖類型：
1. "search" - 搜索特定歌曲、藝人或專輯
2. "recommend" - 根據情緒、氛圍、風格推薦歌曲
3. "playlist" - 創建播放清單
4. "analyze" - 分析某首歌的特徵
5. "personality" - 根據用戶的 MBTI 類型推薦歌曲

你MUST返回有效的 JSON，格式如下（不要有任何前綴或後綴）：
{
  "intent": "search|recommend|playlist|analyze|personality",
  "parameters": {
    "query": "主要查詢詞",
    "mood": "情緒或氛圍（如果適用）",
    "genres": ["風格1", "風格2"],
    "limit": 推薦數量,
    "mbti_type": "MBTI類型（如果是personality意圖）"
  },
  "confidence": 0.0-1.0,
  "reasoning": "簡短說明為什麼這樣判斷"
}

例子：
用戶："推薦一首適合ENFP類型的台灣情歌" 
→ intent: "personality", mbti_type: "ENFP", genres: ["華語流行"]
`;

  try {
    const response = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: `${systemPrompt}\n\n用戶輸入：${userInput}` }]
        }
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 500,
        responseType: 'application/json'
      }
    });

    const responseText = response.response.text();
    // 提取 JSON（處理可能的前綴/後綴）
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('無法從回應中提取 JSON');
    }

    const result = JSON.parse(jsonMatch[0]);
    return result;
  } catch (error) {
    console.error('❌ Gemini API 調用失敗:', error.message);
    // 回退到簡單的關鍵字匹配
    return fallbackIntentDetection(userInput);
  }
}

/**
 * 回退方案：當 Gemini 失敗時使用關鍵字匹配
 */
function fallbackIntentDetection(userInput) {
  const input = userInput.toLowerCase();

  if (input.includes('mbti') || input.includes('性格')) {
    return {
      intent: 'personality',
      parameters: {
        mbti_type: extractMBTI(userInput)
      },
      confidence: 0.6,
      reasoning: '使用關鍵字匹配'
    };
  }

  return {
    intent: 'recommend',
    parameters: { query: userInput },
    confidence: 0.5,
    reasoning: '默認推薦意圖'
  };
}

/**
 * 從文字中提取 MBTI 類型
 */
function extractMBTI(text) {
  const mbtiMatch = text.match(/[IE][SN][TF][JP]/gi);
  return mbtiMatch ? mbtiMatch[0].toUpperCase() : null;
}

// ============ 第二部分：數據補充功能 ============

/**
 * 檢測歌曲語言
 */
function detectLanguage(trackName, artistName) {
  try {
    const text = `${trackName} ${artistName}`;
    const results = detector.detect(text);
    // results 格式: [['zh', 0.95], ['ja', 0.03], ...]
    
    if (results && results.length > 0) {
      const language = results[0][0];
      const confidence = results[0][1];
      
      // 語言代碼映射
      const languageMap = {
        'zh': 'Chinese',
        'en': 'English',
        'ja': 'Japanese',
        'ko': 'Korean',
        'es': 'Spanish',
        'fr': 'French',
        'de': 'German'
      };
      
      return languageMap[language] || language;
    }
    return 'Unknown';
  } catch (error) {
    console.log(`  ⚠️  語言檢測失敗: ${error.message}`);
    return 'Unknown';
  }
}

/**
 * 根據 Spotify 數據推斷主要風格
 */
async function inferGenreFromFeatures(trackFeatures) {
  // 如果已有 Genres 字段，直接使用
  if (trackFeatures.genres && trackFeatures.genres.length > 0) {
    return trackFeatures.genres.split(',')[0].trim();
  }

  // 用音頻特徵推斷風格
  const { energy, danceability, acousticness, valence } = trackFeatures;

  if (energy > 0.7 && danceability > 0.65) {
    return 'Electronic/Dance';
  } else if (acousticness > 0.7 && energy < 0.5) {
    return 'Acoustic/Folk';
  } else if (energy > 0.6 && acousticness < 0.3) {
    return 'Rock/Pop';
  } else if (danceability > 0.6 && valence > 0.6) {
    return 'Pop/Dance-Pop';
  } else if (acousticness > 0.5 && valence < 0.5) {
    return 'Ballad/Slow';
  } else {
    return 'Pop';
  }
}

/**
 * 使用 Gemini 推斷 MBTI 人格類型
 * 結合音頻特徵和風格進行推斷
 */
async function inferMBTIPersonality(trackFeatures, genre, language) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
基於以下音樂特徵，推斷這首歌最適合哪個 MBTI 類型的人聽。
你需要考慮：
- 能量水平反映性格的外向性
- 舞蹈性和節奏反映生活方式
- 情感價值反映情感取向

只返回 4 個大寫字母（如 ENFP, ISTJ），不要任何其他文字。

音樂特徵：
- Energy: ${trackFeatures.energy.toFixed(2)} (0-1，越高越高能)
- Danceability: ${trackFeatures.danceability.toFixed(2)}
- Valence: ${trackFeatures.valence.toFixed(2)} (0-1，越高越積極樂觀)
- Acousticness: ${trackFeatures.acousticness.toFixed(2)} (0-1，越高越原聲)
- Tempo: ${trackFeatures.tempo.toFixed(0)} BPM
- 主要風格: ${genre}
- 歌曲語言: ${language}
`;

  try {
    const response = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 10
      }
    });

    const mbti = response.response.text().trim().toUpperCase();

    // 驗證是否有效的 MBTI
    if (/^[IE][SN][TF][JP]$/.test(mbti)) {
      return mbti;
    }
  } catch (error) {
    console.log(`  ⚠️  Gemini MBTI 推斷失敗: ${error.message}`);
  }

  // 備選方案：使用特徵映射
  return inferMBTIByFeatures(trackFeatures);
}

/**
 * 備選方案：根據特徵映射推斷 MBTI
 */
function inferMBTIByFeatures(features) {
  const { energy, danceability, valence, acousticness, tempo } = features;
  let scores = {};

  for (const [mbti, mapping] of Object.entries(MBTI_FEATURE_MAPPING)) {
    let matchCount = 0;
    let score = 0;

    // 檢查每個特徵的匹配度
    if (mapping.energyMin !== undefined) {
      matchCount++;
      if (energy >= mapping.energyMin) score++;
    }
    if (mapping.energyMax !== undefined) {
      matchCount++;
      if (energy <= mapping.energyMax) score++;
    }
    if (mapping.danceabilityMin !== undefined) {
      matchCount++;
      if (danceability >= mapping.danceabilityMin) score++;
    }
    if (mapping.valenceMin !== undefined) {
      matchCount++;
      if (valence >= mapping.valenceMin) score++;
    }
    if (mapping.valenceMax !== undefined) {
      matchCount++;
      if (valence <= mapping.valenceMax) score++;
    }
    if (mapping.acousticnessMin !== undefined) {
      matchCount++;
      if (acousticness >= mapping.acousticnessMin) score++;
    }
    if (mapping.tempoMin !== undefined) {
      matchCount++;
      if (tempo >= mapping.tempoMin) score++;
    }
    if (mapping.tempoMax !== undefined) {
      matchCount++;
      if (tempo <= mapping.tempoMax) score++;
    }

    // 計算匹配率
    scores[mbti] = matchCount > 0 ? (score / matchCount) : 0;
  }

  // 返回最高匹配度的 MBTI
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  return sorted[0] ? sorted[0][0] : 'ENFP'; // 默認值
}

// ============ 批量數據補充 ============

/**
 * 延遲函數（避免 API 限流）
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 補充 CSV 數據
 */
async function enrichCSVWithData(inputPath, outputPath) {
  console.log('\n🔄 開始補充 CSV 數據...\n');

  const records = [];
  const enrichedRecords = [];

  // 第 1 步：讀取原始 CSV
  return new Promise((resolve, reject) => {
    fs.createReadStream(inputPath)
      .pipe(csv())
      .on('data', (row) => {
        records.push(row);
      })
      .on('end', async () => {
        console.log(`📊 讀取 ${records.length} 條記錄\n`);

        // 第 2 步：逐個補充數據
        for (let i = 0; i < records.length; i++) {
          const track = records[i];
          const trackName = track['Track Name'] || '';
          const artistName = track['Artist Name(s)'] || '';

          console.log(`[${i + 1}/${records.length}] 處理: ${trackName}`);

          // 檢測語言
          track.language = detectLanguage(trackName, artistName);
          console.log(`  └─ 語言: ${track.language}`);

          // 補充風格
          const features = {
            energy: parseFloat(track.Energy) || 0,
            danceability: parseFloat(track.Danceability) || 0,
            valence: parseFloat(track.Valence) || 0,
            acousticness: parseFloat(track.Acousticness) || 0,
            tempo: parseFloat(track.Tempo) || 0,
            genres: track.Genres || ''
          };

          track.genre = await inferGenreFromFeatures(features);
          console.log(`  └─ 風格: ${track.genre}`);

          // 推斷 MBTI
          track.mbti_personality = await inferMBTIPersonality(
            features,
            track.genre,
            track.language
          );
          console.log(`  └─ MBTI: ${track.mbti_personality}\n`);

          enrichedRecords.push(track);

          // 避免 API 限流
          if (i < records.length - 1) {
            await sleep(500);
          }
        }

        // 第 3 步：寫入新 CSV
        writeEnrichedCSV(enrichedRecords, outputPath);
        console.log(`\n✅ 完成！已保存至: ${outputPath}`);
        resolve();
      })
      .on('error', reject);
  });
}

/**
 * 寫入補充後的 CSV
 */
function writeEnrichedCSV(records, outputPath) {
  if (records.length === 0) return;

  const headers = Object.keys(records[0]);
  const csvLines = [headers.join(',')];

  for (const record of records) {
    const values = headers.map(header => {
      const value = record[header];
      if (value === null || value === undefined) {
        return '';
      }
      // 如果包含逗號或引號，需要用引號包裹
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    });
    csvLines.push(values.join(','));
  }

  fs.writeFileSync(outputPath, csvLines.join('\n'), 'utf-8');
}

// ============ 主程式 ============

async function main() {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║   MBTI 音樂推薦系統 - 改進版本          ║');
  console.log('║   Powered by Gemini AI Agent           ║');
  console.log('╚════════════════════════════════════════════╝\n');

  // 檢查 API Key
  if (GEMINI_API_KEY === 'YOUR_API_KEY_HERE') {
    console.error('❌ 請設置 GEMINI_API_KEY 環境變量');
    process.exit(1);
  }

  // 示例 1：測試 AI Agent 意圖判斷
  console.log('─── 示例 1: AI Agent 意圖判斷 ───\n');

  const testQueries = [
    '推薦一首適合 ENFP 類型的台灣情歌',
    '我想找 5 月天的歌',
    '給我一首放鬆的歌',
    '創建一個適合工作時聽的播放清單'
  ];

  for (const query of testQueries) {
    console.log(`📝 用戶輸入: "${query}"`);
    try {
      const decision = await analyzeUserQueryWithGemini(query);
      console.log('✅ AI 決策:', JSON.stringify(decision, null, 2));
    } catch (error) {
      console.error('❌ 錯誤:', error.message);
    }
    console.log();
    await sleep(1000);
  }

  // 示例 2：補充 CSV 數據（可選，取決於用戶是否想執行）
  // const inputFile = './十年全精選_華語流行.csv';
  // const outputFile = './十年全精選_華語流行_enriched.csv';
  // if (fs.existsSync(inputFile)) {
  //   await enrichCSVWithData(inputFile, outputFile);
  // }
}

// 導出函數供其他模塊使用
module.exports = {
  analyzeUserQueryWithGemini,
  enrichCSVWithData,
  detectLanguage,
  inferMBTIPersonality,
  MBTI_FEATURE_MAPPING
};

// 執行主程式
if (require.main === module) {
  main().catch(console.error);
}
