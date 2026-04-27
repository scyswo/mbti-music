
# 🎧 MBTI 音樂人格測驗

透過 10 道 AI 生成的情境式問題，分析你的音樂靈魂，對應 16 種 MBTI 人格類型，並從歌曲資料庫中精選 3 首最適合你的歌曲。

**線上體驗：** [mbti-music-1.vercel.app](https://mbti-music-1.vercel.app)

---

## 功能特色

- **AI 動態出題** — Google Gemini 2.5 Flash 即時生成 10 道情境題，每次測驗皆不同
- **MBTI 人格分析** — AI 根據五維音樂特徵判斷你的 MBTI 類型，並產出有溫度的人格描述
- **智慧歌曲推薦** — 以 Cosine Similarity 從 Supabase 資料庫找出最匹配的 3 首歌，嵌入 Spotify 播放器
- **風格偏好量表** — 視覺化呈現你在 5 種音樂風格的傾向分佈
- **截圖分享卡** — 一鍵下載 JPG 結果卡片，方便分享給朋友
- **自動容錯** — Gemini 失敗時自動切換本地靜態題庫，Supabase 失敗時歌曲欄位留空，服務不中斷
- **API Key 輪替** — 支援最多 4 組 Gemini Key，配額耗盡自動切換下一組

---
## Project Demo
<img width="1659" height="675" alt="未命名設計2" src="https://github.com/user-attachments/assets/2bdccd21-c7d5-4211-ba28-660a9baacb90" />

## 技術架構

| 層級 | 技術 |
|------|------|
| 前端框架 | React 19、React Router v7 |
| 動畫 | Framer Motion |
| AI 引擎 | Google Gemini 2.5 Flash |
| 資料庫 | Supabase（PostgreSQL） |
| 音樂播放 | Spotify Embed |
| 截圖匯出 | html2canvas |
| 部署 | Vercel |

---

## 系統流程

```
使用者輸入暱稱
       ↓
  quizOrchestrator
       ├── [AI 正常] geminiService → Gemini 動態生成 10 題（快取 30 分鐘）
       └── [AI 失敗] static_quiz.json → 本地題庫隨機抽 10 題
       ↓
  使用者作答（每題對應五維特徵值）
       ↓
  musicMath.js → 計算五維特徵平均值 & 風格偏好權重
       ↓
  analysisService
       ├── [AI 正常] Gemini 分析 MBTI 人格 + 描述文字
       └── [AI 失敗] buildLocalAnalysis → 本地規則產生人格描述
       ↓
  musicService → Supabase 查詢 + Cosine Similarity 匹配前 3 首歌
       ↓
  結果頁面
       ├── MBTI 類型 + 音樂人格稱號
       ├── 風格偏好量表
       ├── 偏好分析（喜歡 / 不偏好 / 聆聽時段）
       ├── Spotify 嵌入播放器（3 首推薦歌曲）
       └── 截圖下載 / 複製分享連結
```

---

## 專案結構

```
src/
├── core/
│   ├── geminiService.js      # Gemini API 整合（Key 輪替、指數退避、快取）
│   ├── analysisService.js    # 分析流程協調
│   ├── musicService.js       # Supabase 歌曲查詢
│   └── quizOrchestrator.js   # AI 出題 / 靜態 fallback
├── modules/
│   ├── ai-engine/
│   │   ├── MainQuiz.jsx      # AI 模式測驗頁
│   │   └── UnifiedResult.jsx # AI 模式結果頁
│   └── classic-mode/
│       ├── Quiz.jsx          # 經典模式測驗頁（V1）
│       ├── Loading.jsx
│       ├── Result.jsx
│       └── Share.jsx
├── helpers/
│   ├── musicMath.js          # Cosine Similarity、特徵正規化、風格權重
│   └── quizConfig.js         # MBTI 映射表、本地分析 fallback
├── components/common/
│   ├── ProgressBar.jsx
│   └── SpotifyIframe.jsx
├── agents/                   # V1 Orchestrator 工具鏈
└── pages/Home.jsx
public/
└── static_quiz.json          # 本地備用題庫（25 題）
```

---

## 快速開始

### 1. 安裝依賴

```bash
npm install
```

### 2. 建立 `.env` 設定檔

在專案根目錄建立 `.env`（請勿提交至 Git）：

```env
# Gemini API Key（至少填一組，最多支援 4 組自動輪替）
REACT_APP_GEMINI_API_KEY=你的金鑰
REACT_APP_GEMINI_API_KEY_1=備用金鑰_1
REACT_APP_GEMINI_API_KEY_2=備用金鑰_2
REACT_APP_GEMINI_API_KEY_3=備用金鑰_3

# Supabase
REACT_APP_SUPABASE_URL=https://你的專案.supabase.co
REACT_APP_SUPABASE_ANON_KEY=你的anon金鑰
```

### 3. Supabase `songs` 資料表欄位

| 欄位 | 類型 | 說明 |
|------|------|------|
| `spotify_id` | text | Spotify Track ID |
| `name` | text | 歌曲名稱 |
| `artist` | text | 歌手名稱 |
| `lang` | text | 語言（`zh` / `ko` / `en`） |
| `valence` | float | 正向感 0.0–1.0 |
| `energy` | float | 能量強度 0.0–1.0 |
| `danceability` | float | 舞動感 0.0–1.0 |
| `tempo` | float | BPM（程式自動正規化為 0–1） |
| `acousticness` | float | 原音感 0.0–1.0 |

### 4. 啟動開發伺服器

```bash
npm start
# 瀏覽器開啟 http://localhost:3000
```

### 5. 打包部署

```bash
npm run build
```

---

## 路由結構

| 路徑 | 頁面 | 說明 |
|------|------|------|
| `/` | Home | 首頁，輸入暱稱 |
| `/v2` | MainQuiz | AI 模式測驗（主要入口） |
| `/v2/result` | UnifiedResult | AI 模式結果頁 |
| `/quiz` | ClassicQuiz | 經典模式測驗（V1） |
| `/loading` | ClassicLoading | 載入頁 |
| `/result` | ClassicResult | 經典模式結果頁 |
| `/share/:id` | ClassicShare | 公開分享頁 |

---

## MBTI 判斷規則

根據使用者 10 題的五維特徵平均值依序判斷：

| 維度 | 規則 |
|------|------|
| E vs I | energy ≥ 0.55 → E，否則 → I |
| S vs N | acousticness ≥ 0.50 → S，否則 → N |
| T vs F | valence ≥ 0.50 → F，否則 → T |
| J vs P | tempo ≥ 0.50 → J，否則 → P |

---

## 音樂風格特徵對照

| 風格 | valence | energy | acousticness | tempo（正規化） |
|------|---------|--------|--------------|----------------|
| Chill / Soft | 0.4–0.6 | 0.1–0.4 | 0.6–1.0 | 0.2–0.4 |
| Sad / Emotional | 0.0–0.3 | 0.1–0.4 | 0.5–0.9 | 0.2–0.45 |
| Romantic / Sweet | 0.5–0.8 | 0.2–0.5 | 0.5–0.85 | 0.3–0.55 |
| Dark / Moody | 0.0–0.3 | 0.4–0.8 | 0.0–0.4 | 0.4–0.7 |
| Happy / Bright | 0.7–1.0 | 0.6–1.0 | — | 0.55–0.9 |

---

## 注意事項

- Gemini 免費方案每日有配額限制，建議設定多組 Key 輪替
- 配額全數耗盡或 AI 服務異常時，系統自動切換 `static_quiz.json` 靜態題庫繼續服務
- Spotify Embed 在無痕模式或部分地區可能無法播放
- `.env` 中的 API Key 在 React 前端為 client-side 暴露，正式環境建議透過後端 proxy 呼叫
